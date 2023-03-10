<template>
    <div
        v-if="event"
        class="right-0 left-0 mx-auto event-card cursor-pointer"
        :ref="`medians_calendarEventRef-${event.id}`"
        :style="`
          height: ${distance}; 
          width: ${width_value}; 
          top: ${top_offset};
        `"
        :class="{
            'canceled': event.status == 'canceled',
            'is-past': isPast,
            'is-past': isPast,
            overlaps: overlaps > 0,
            'two-in-one': total > 1,
            inspecting: !!inspecting,
            'event-card__mini': event.distance <= 10,
            'event-card__small':
                (event.distance > 10 && event.distance < 40) || overlaps > 1,
        }"
        :id="'event-'+index"
        @mouseup="mouseUp"
        draggable="true" 
        ondragstart="drag(event)"
    >

        <div :class="event.classes" :key="`opacity${opacity}`" :style="`opacity:${opacity}`" class="animated fadeIn rounded-lg px-2 py-3">
            <portal-target
                name="event-details"
                :slot-props="event"
                slim
            />
        </div>

    </div>

</template>
<script>
import { isBefore, getLocaleTime, addTimezoneInfo , getTopDistance } from './utils.js';

export default {
    props: ['event', 'total', 'index', 'overlaps','column_index'],
    mounted() {
        let t = this;
        setTimeout(function () {
            jQuery('#event-'+t.index+' > .animated').css('opacity', 1)
        }, this.column_index * this.medians_calendar_options.animation_speed)
    },
    inject: ['medians_calendar_options'],
    data: () => ({
        opacity: 0,
        inspecting: false,
        editing: false,
    }),
    computed: {
        isPast() {
            let now = getLocaleTime(new Date().toISOString());
            return isBefore(this.event.start.value, now);
        },
        width_value() {
            return `calc(100% - 10px)`;
        },
        left_offset() {
            return `10px`;
        },
        top_offset() {

            let topDistance = getTopDistance(this.event.from,  this.medians_calendar_options.hourlySelection)
            return topDistance > 0
                ? `${(topDistance/10) * this.medians_calendar_options.cell_height}px`
                : `0px`;
        },
        distance() {
            if (!this.event) return;
            let multiplier = this.medians_calendar_options.cell_height / 10;
            // 0.5 * multiplier for an offset so next cell is easily selected
            return `${this.event.distance * multiplier - 0.2 * multiplier}px`;
        },
        status() {
            return (this.event && this.event.status) || this.editing;
        },
        information() {
            let { start, end, data, id, key } = this.event;
            let payload = {
                start_time: addTimezoneInfo(start),
                end_time: addTimezoneInfo(end),
                medians_calendar_id: id,
                key,
                data,
            };

            return payload;
        },
        editEvent() {
            this.$medians_calendar.closePopups();
            this.editing = true;
        },
        closeEventPopup() {
            this.editing = false;
        },

    },
    methods: {
        mouseUp()
        {
            if (this.event.status == 'canceled')
            {
                this.$alert(this.$root.__('this_is_canceled_event'))
            }
            this.$parent.show_modal(this.event);
        },
        log(data)
        {
            this.$parent.log(data);
        },
    }
};
</script>
<style lang="scss">
$creator-bg: #34aadc;
$creator-content: white;

.event-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    h4,
    p,
    span {
        margin: 0px;
    }

    > * {
        flex: 1;
        position: relative;
    }

    &.creating {
        z-index: -1;
    }

    &.overlaps > * {
        border: solid 1px white !important;
    }

    &.inspecting {
        z-index: 11 !important;

        .created-event {
            box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
                0 1px 18px 0 rgba(0, 0, 0, 0.12),
                0 3px 5px -1px rgba(0, 0, 0, 0.2);
            transition: opacity 100ms linear;
        }
    }

    &__mini {
        .created-event > .details-card > * {
            display: none;
        }

        .appointment-title,
        .time {
            display: block !important;
            position: absolute;
            top: 0;
            font-size: 9px;
            z-index: 1;
            overflow: visible;
            height: 100%;
        }
    }

    &__small {
        .appointment-title {
            font-size: 80%;
        }

        .time {
            font-size: 70%;
        }
    }

    &.two-in-one .details-card > * {
        font-size: 60%;
    }

    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0; //z-index: 20!important;
    //background-color: rgba($creator-bg, .85);
    color: $creator-content;
    user-select: none;
    will-change: height; //padding: 4px 6px;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    p {
        margin: 0px;
    }
}

.time {
    position: absolute;
    bottom: 0px;
    right: 0px;
    font-size: 11px;
}

.popup-wrapper {
    text-shadow: none;
    color: black;
    z-index: 10;
    position: absolute;
    top: 0;
    left: calc(100% + 5px);
    display: flex;
    flex-direction: column;
    pointer-events: all;
    user-select: none;
    background-color: white;
    border: solid 1px rgba(black, 0.08);
    border-radius: 4px;
    box-shadow: 0px 2px 12px -3px rgba(black, 0.3);
    padding: 10px;

    h4 {
        color: black;
        font-weight: 400;
    }

    input,
    textarea {
        border: none;
        background-color: darken(white, 8);
        color: lighten(black, 1);
        border-radius: 4px;
        padding: 5px 8px;
        margin-bottom: 5px;
    }
}

.created-event {
    pointer-events: all;
    position: relative;

    > .details-card {
        max-width: 100%;
        width: 100%;
        overflow: hidden;
        position: relative;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;

        > h1,
        h2,
        h3,
        h4,
        p,
        small,
        strong,
        span {
            text-overflow: ellipsis;
            overflow: hidden;
            display: block;
        }
    }
}

ul:last-child .popup-wrapper {
    left: auto;
    right: 100%;
    margin-right: 10px;
}

.day-view ul .popup-wrapper {
    left: auto;
    right: auto;
    width: calc(100% - 10px);
    top: 10px;
}
</style>
<style lang="css">
    .animated
    {
        opacity: 0;
        transition: all .5s ease-in-out;
    }
</style>