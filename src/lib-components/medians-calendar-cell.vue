<template>
    <div
        class="medians-calendar-cell rounded relative"
        :class="{
            selected: selected,
            'is-an-hour': isAnHour(index),
            'has-events': cell_events && cell_events.length > 0,
            'being-created': !!being_created || hasPopups,
        }"
        :style="
            `
      height: ${medians_calendar_options.cell_height}px;
    `
        "
        >
    <div>
        
        <MediansCalendarEvent
            :style="`z-index: 10`"
            v-if="cell_events && cell_events.length && event  "
            v-for="(event, eventIndex) in cell_events"
            :event="event"
            :key="eventIndex"
            :total="cell_events.length"
            :index="eventIndex"
            :overlaps="overlapValue"
        />
    </div>
    </div>
</template>
<script>
import { cloneObject, getLocaleTime } from './utils.js';

export default {
    props: [
        'device',
        'constructedEvents',
        'temporaryEvent',
    ],
    inject: ['medians_calendar_options'],
    components: {
        MediansCalendarEvent: () => import('./medians-calendar-event.vue'),
    },
    computed: {
        cell_events() {
            let all_events = [];
            if (this.constructedEvents && this.constructedEvents.length) {
                for (var i = this.constructedEvents.length - 1; i >= 0; i--) 
                {
                    if (this.constructedEvents[i] && this.constructedEvents[i].start == this.cellData.time) 
                    {
                        all_events[i] = this.constructedEvents[i];
                    }
                }
            }
            return all_events;
        },
        completed_events() {
            return (
                this.constructedEvents &&
                this.constructedEvents.hasOwnProperty(this.cellData.value) &&
                this.constructedEvents[this.cellData.value]
            );
        },
        overlappingEvents() {
            if (!this.constructedEvents || this.cell_events.length < 1)
                return [];
            return Object.values(this.constructedEvents)
                .flat()
                .filter(event => {
                    let cellDate = new Date(this.cellData.value);
                    let eventStarts = new Date(event.start);
                    let eventEnds = new Date(event.end);
                    return eventStarts < cellDate && eventEnds > cellDate;
                });
        },
        overlapValue() {
            let length = this.overlappingEvents.length;
            return length > 2 ? 2 : length;
        },
        selected() {
            return this.cell_events && this.cell_events.length > 0;
        },
        hasPopups() {
            return (
                this.selected &&
                !!this.cell_events.find(ev => ev && ev.status === 'active')
            );
        },
    },
    methods: {
        mouseUp() {
            this.log('Mouse up')
        },
        resetCreator() {
            this.$emit('reset');
        },
        isAnHour(index) {
            if(this.medians_calendar_options.hourlySelection) {
                return true
            } else {
                return (index + 1) % (60 / 10) === 0
            }
        },

        show_modal(item = null){
            this.$parent.show_modal(item);
        },
        log(data)
        {
            this.$parent.log(data);
        },
    },
};
</script>
<style lang="scss">
$creator-bg: #34aadc;
$creator-content: white;

li {
    font-size: 13px;
    position: relative;
}

.created-events {
    //width: 100%;
    height: 100%;
}

ul.building-blocks {
    li {
        z-index: 0;
        border-bottom: dotted 1px var(--odd-cell-border-color);

        &.first_of_appointment {
            z-index: 1;
            opacity: 1; //z-index:0;
        }

        &.is-an-hour {
            border-bottom: solid 1px var(--table-cell-border-color);
        }

        &.has-events {
            z-index: unset;
        }

        &.being-created {
            z-index: 11;
        }
    }
}
</style>
