<template>
    <div
        v-if="cellData.visible"
        class="text-xs hover:text-gray-600 border-gray-100 hover:bg-gray-100 border medians-calendar-cell-bg rounded relative cell-bg"
        :class="{
            // selected: selected,
            'is-an-hour': isAnHour(index),
            'bg-gray-200': showBgHover,
            'bg-blue-200': showBgSelect,
            // 'being-created': !!being_created || hasPopups,
        }"
        :style="
            `
      height: ${medians_calendar_options.cell_height}px;
    `
        "
        @mouseover="showBgHover = true; "
        @mouseout="showBgHover = false; "
        @mouseover.self="mouseMove()"
        @mousedown.self="mouseDown()"  
        @mouseup="mouseUp()"  
        ondrop="drop(event)" 
        ondragover="allowDrop(event)"
        >
        <div v-if="cellData.value" style="pointer-events: none;">
            <div  v-text="cellData.value.slice(11,16)">
                
            </div>
        </div>
    </div>


            <div id="div1" class="w-full h-40 border" style="" ></div>

            <img id="drag1" src="/uploads/images/Logo-63f4998214037.png" draggable="true" ondragstart="drag(event)" width="336" height="69">
</template>
<script>
import { cloneObject, getLocaleTime } from './utils.js';

export default {
    date: () => ({
            showBgSelect: false,
            showBgHover: false
    }),
    props: [
        'device',
        'creator',
        'index',
        'cellData',
        'constructedEvents',
        'temporaryEvent',
    ],
    inject: ['medians_calendar_options'],
    components: {
        MediansCalendarEvent: () => import('./medians-calendar-event.vue'),
    },
    computed: {
        
    },
    methods: {
        mouseDown() {

            // user mouse got depressed while outside medians-calendar-cells
            // came back in and clicked while the creator was on
            if (!!this.creator.creating) {
                this.mouseUp();
                return;
            }
            let {
                read_only,
                overlap,
                past_event_creation,
            } = this.medians_calendar_options;
            if (read_only) return;

            // if past_event_creation is set to false, check if cell value is
            // before current time
            if (past_event_creation === false) {
                let now = getLocaleTime(new Date());
                if (new Date(now) > new Date(this.cellData.value)) {
                    this.mouseUp();
                    return;
                }
            }

            // if overlap is set to false, prevent selection on top of
            // other events

            // close any open popups in the whole medians_calendar instance
            // before starting a new one
            this.$medians_calendar.closePopups();

            // create a payload consisting of
            // starting, current, ending and originalStarting cell
            // starting, current and ending are self explanatory
            // but originalStarting cell is required
            // to determine the direction of the scroll/drag
            let payload = {
                creating: true,
                original_starting_cell: cloneObject(this.cellData),
                starting_cell: cloneObject(this.cellData),
                current_cell: cloneObject(this.cellData),
                ending_cell: cloneObject(this.cellData),
            };
            this.$emit('select', payload);
        },
        mouseMove() {

            // same guards like in the mouseDown function
            let { read_only, overlap } = this.medians_calendar_options;
            if (read_only) return;
            if (this.creator && !this.creator.creating) return;
            let {
                starting_cell,
                original_starting_cell,
                creating,
            } = this.creator;

            // direction of scroll
            let going_down =
                this.cellData.index >= starting_cell.index &&
                starting_cell.index === original_starting_cell.index;

            if (creating) {
                let payload = {
                    ...this.creator,
                    current_cell: this.cellData,
                    ending_cell: this.cellData,
                    direction: going_down ? 'normal' : 'reverse',
                };
                this.$emit('select', payload);
            }
        },
        mouseUp() {
            this.showBgSelect = false
            this.$emit('initiatePopup');
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
.cell-bg{
    div {
        display:none
    }
}

.cell-bg{
    &:hover,
    &:active {
        div {
            display:block
        }
    }
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
