<template>
    <div style="position: relative;" id="day-wrapper" :class="{
      'is-weekend': isWeekend,
      'is-today': isToday,
      creating: creator.creating || creator.status === 'active'
    }" class="medians-calendar-day" :ref="day.value + '-reference'">
        <div ref="nowIndicator" id="now-indicator" :class="
        medians_calendar_options.style === 'material_design'
          ? 'hour-indicator-line'
          : 'hour-indicator-tooltip'
      " v-if="isToday" :style="`top:${passedTime}px`">
            <span class="line" v-show="medians_calendar_options.style === 'material_design'"></span>
        </div>

        <div>
                
            <medians-calendar-cell-bg  
                v-for="(cell, index) in day_cells" 
                :key="`cell-bg-${index}`" 
                :creator="creator" 
                :cell-data="cell" 
                :index="index" 
                :device="device" 
                @select="updateCreator" 
                @reset="resetEvents()" 
                @initiatePopup="initiatePopup()" 
                :temporary-event="temporary_event" 
                />
        </div>

            <MediansCalendarEvent
                :style="`z-index: 10`"
                v-if="day_events && day_events.length && event  "
                v-for="(event, eventIndex) in day_events"
                :event="event"
                :key="eventIndex+device.id"
                :total="day_events.length"
                :index="eventIndex"
                :column_index="column_index"
            />
        <div class="w-full absolute top-0 left-0" style="z-index: 9999;">
            
        </div>
    </div>
</template>
<script>
import { isToday, isWeekend, cloneObject, getLocaleTime, getDistance, getTopDistance } from "./utils";

import myWorker from "@/lib-components/workers";

export default {
    props: ["events", "day", "passedTime", "device","column_index"],
    created() {
        // get and render day cells
        // and then render any event
        // on top of them
        this.renderDay();
    },
    components: {
        MediansCalendarCell: () => import("./medians-calendar-cell.vue"),
        MediansCalendarEvent: () => import('./medians-calendar-event.vue'),
        MediansCalendarCellBg: () => import("./medians-calendar-cell-bg.vue")
    },
    provide() {
        // provide these methods to children components
        // for easier access
        return {
            medians_calendarAddEvent: this.addEvent,
            medians_calendarClearPopups: this.clearCreatingLeftovers
        };
    },
    // inject medians_calendar options from parent component
    inject: ["medians_calendar_options"],
    mounted() {
        if (this.medians_calendar_options.scrollToNow && this.isToday) this.scrollView();
    },
    computed: {
        isWeekend() {
            return isWeekend(this.day.value);
        },
        isToday() {
            return isToday(this.day.value);
        }
    },
    data: () => ({
        // this is the main object
        // we use to make selections
        // and control their flows
        creator: {
            creating: false,
            starting_cell: null,
            original_starting_cell: null,
            current_cell: null,
            ending_cell: null,
            status: null
        },
        // temporary event is an object
        // that holds values of creator
        // when the popup is initiated
        temporary_event: null,

        // day cells and events are used for rendering purposes
        day_cells: [],
        day_events: null
    }),
    methods: {
        renderDay() {
            myWorker
                .send("getDayCells", {
                    day: this.day.value,
                    hourOptions: {
                        start_hour: this.medians_calendar_options.day_starts_at,
                        end_hour: this.medians_calendar_options.day_ends_at,
                    },
                    hourlySelection: this.medians_calendar_options.hourlySelection
                })
                .then(reply => {
                    this.day_cells = reply;
                    return this.getDayEvents(this.$parent.events);
                });
        },


        checkEventValidity(payload) {
            let { from, to } = payload;
            if (!from || !to) return "No dates were provided in the payload";
            /*if (isoFrom !== from) {
              return 'From date is not ISO format';
            }
            if (isoTo !== to) {
              return 'To date is not ISO format';
            }*/
            return null;
        },
        getDayEvents(events) {

            let clonedEvents = [];
            if (this.$parent.events)
            {
                this.medians_calendar_events = this.$parent.events;
                for (var i = this.medians_calendar_events.length - 1; i >= 0; i--) {
                    if (this.medians_calendar_events[i] && this.device && this.device.id && this.device.id ==  this.medians_calendar_events[i].device.id ){
                        clonedEvents[i] = cloneObject(this.medians_calendar_events[i]);
                        clonedEvents[i].distance = getDistance(this.medians_calendar_events[i], this.medians_calendar_options.hourlySelection);
                    }
                }
            }
            this.day_events = clonedEvents
            return clonedEvents;
        },
        clearCreatingLeftovers() {
            for (let key in this.day_events) {
                let hasPending = this.day_events[key].some(event => {
                    return event ? (
                        event.status === "active" || event.status === "creating"
                    ) : null;
                });
                if (hasPending) {
                    let completed = this.day_events[key].filter(
                        event => event.status === "completed"
                    );
                    this.$set(this.day_events, key, completed);
                    if (completed.length === 0) {
                        delete this.day_events[key];
                    }
                }
            }
            this.resetEvents();
        },
        resetEvents() {
            if (!this.creator.creating && this.creator.status === null) return;
            this.creator = {
                creating: false,
                starting_cell: null,
                original_starting_cell: null,
                current_cell: null,
                ending_cell: null,
                status: null,
                temporary_id: null
            };
            this.temporary_event = null;
        },

        // this method is what we use
        // to start the flow of selecting a new cell
        // while the creator is enabled
        updateCreator(payload) {
            this.creator = {
                ...this.validateSelection(payload),
                status: "creating"
            };
            if (
                this.medians_calendar_options.overlap === false &&
                Object.keys(this.day_events).length > 0
            ) {
                let fixedOverlap = this.overlapPolice(payload);
                if (fixedOverlap) {
                    this.creator = this.validateSelection(fixedOverlap);
                    this.selectCell();
                    this.initiatePopup();
                    return;
                }
            }
            this.selectCell();
        },

        // when the direction is reversed,
        // the ending cell is actually the originally selected cell
        validateSelection(event) {
            let { original_starting_cell, starting_cell, current_cell } = event;
            if (
                event.direction === "reverse" &&
                original_starting_cell.index > current_cell.index
            ) {
                return {
                    ...event,
                    starting_cell: current_cell,
                    ending_cell: original_starting_cell
                };
            }
            return event;
        },
        selectCell() {
            // if (!this.creator.creating) return;
            // let {
            //     creating,
            //     ending_cell,
            //     current_cell,
            //     starting_cell,
            //     original_starting_cell
            // } = this.creator;

            // let real_ending_cell_index = ending_cell.index + 1;
            // ending_cell = this.day_cells[real_ending_cell_index];

            // const diffInMs =
            //     new Date(ending_cell.value) - new Date(starting_cell.value);
            // const diffInHrs = Math.floor((diffInMs % 86400000) / 3600000);
            // const diffMins = Math.round(((diffInMs % 86400000) % 3600000) / 60000);
            // let startDate = new Date(starting_cell.value);
            // let endDate = new Date(ending_cell.value);

            // let distance = diffMins + diffInHrs * (this.medians_calendar_options.hourlySelection ? 10 : 60);

            // this.temporary_event = {
            //     start: {
            //         masked_value: startDate.toISOString(),
            //         value: startDate.toISOString(),
            //         rounded: false,
            //         round_offset: null
            //     },
            //     end: {
            //         masked_value: endDate.toISOString(),
            //         value: endDate.toISOString(),
            //         rounded: false,
            //         round_offset: null
            //     },
            //     distance: distance,
            //     status: "creating"
            // };
        },
        initiatePopup() {
            if (this.creating && this.creator.status !== "creating") return;
            this.creator = {
                ...this.creator,
                status: "active",
                creating: false
            };
            let {
                ending_cell,
                current_cell,
                starting_cell,
                original_starting_cell
            } = this.creator;
            
            if  (ending_cell)
            {

                let real_ending_cell_index = ending_cell.index + 1;
                ending_cell = this.day_cells[real_ending_cell_index];
                this.creator.device = this.device;
                this.show_modal(this.creator)

                const diffInMs =
                    new Date(ending_cell.value) - new Date(starting_cell.value);
                const diffInHrs = Math.floor((diffInMs % 86400000) / 3600000);
                const diffMins = Math.round(((diffInMs % 86400000) % 3600000) / 60000);
                let startDate = new Date(starting_cell.value);
                let endDate = new Date(ending_cell.value);

                let finalEvent = {
                    start: {
                        masked_value: startDate.toISOString(),
                        value: startDate.toISOString(),
                        rounded: false,
                        round_offset: null
                    },
                    end: {
                        masked_value: endDate.toISOString(),
                        value: endDate.toISOString(),
                        rounded: false,
                        round_offset: null
                    },
                    distance: diffMins + diffInHrs * (this.medians_calendar_options.hourlySelection ? 10 : 60),
                    status: "active"
                };

                let updated_events = this.day_events[starting_cell.value];
                if (!updated_events) updated_events = [];
                updated_events.push(finalEvent);

                this.$set(this.day_events, starting_cell.value, updated_events);
                this.temporary_event = null;
            }

        },
        overlapPolice(payload) {
            if (!payload.current_cell) return;
            let overlapped = Object.keys(this.day_events)
                .map(evKey => {
                    return this.day_events[evKey];
                })
                .flat()
                .filter(event => {
                    let cellStart = new Date(payload.starting_cell.value);
                    let cellEnd = new Date(payload.ending_cell.value);
                    let eventStarts = new Date(event.start.value);
                    let eventEnds = new Date(event.end.value);
                    return (
                        (cellEnd > eventStarts && cellEnd < eventEnds) ||
                        (cellStart < eventStarts && cellEnd > eventStarts)
                    );
                });
            if (!overlapped || overlapped.length === 0) {
                return;
            }
            let newPayload = payload;
            if (payload.direction === "reverse") {
                let needed_cell = overlapped[0].end;
                let event_cell = this.day_cells.find(
                    c => c.value === needed_cell.masked_value
                );
                let cell = this.day_cells[event_cell.index];
                newPayload.starting_cell = {
                    value: cell.value,
                    index: cell.index
                };
                newPayload.current_cell = {
                    value: cell.value,
                    index: cell.index
                };
            } else {
                let needed_cell = overlapped[0].start;
                let event_cell = this.day_cells.find(
                    c => c.value === needed_cell.masked_value
                );
                let cell = this.day_cells[event_cell.index - 1];
                newPayload.ending_cell = {
                    value: cell.value,
                    index: cell.index
                };
            }
            return newPayload;
        },
        scrollView() {
            let topoffset = this.passedTime;
            setTimeout(() => {
                var myElement = document.getElementById('now-indicator');
                var topPos = myElement ? myElement.offsetTop : 10;
                document.getElementById('day-wrapper').scrollTop = topPos;

                // window.scroll({ top: topoffset, left: 0, behavior: "smooth" });
            }, 1000);
        },

        show_modal(item = null) {
            this.$parent.show_modal(item);
        },
        log(data) {
            this.$parent.log(data);
        },
    }
};
</script>
<style lang="scss">
ul.medians-calendar-day {
    position: relative;
    background-color: white;

    &.is-weekend {
        background-color: var(--weekend-color);
    }

    &.is-today {
        background-color: var(--current-day-color);
    }

    .clear {
        position: absolute;
        z-index: 1;
        top: -20px;
        right: 0;
        font-size: 10px;
    }

    &.creating {
        z-index: 11;

        .created-event {
            pointer-events: none;
        }
    }
}
</style>