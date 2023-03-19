<template>
    <div
        class="medians-calendar-wrapper px-2 "
        id="calendar_wrapper"
        :class="{
            'no-scroll': !scrollable,
            gstyle: medians_calendar_options.style === 'material_design',
            'day-view': medians_calendar_options.view_type === 'day',
        }"
        @touchstart="scrollable = false"
        @touchend="scrollable = true"
        >
        <div class="week-navigator" style="direction:ltr;">
            <div
                class="nav-wrapper"
                v-if="medians_calendar_options.view_type === 'week'"
            >
                <button class="week-navigator-button" @click="changeDay(-7)">
                    <svg
                        style="transform: rotate(180deg)"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="css-i6dzq1"
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div>
                    <span>{{
                        medians_calendar_options.formatWeekNavigator(current_day)
                    }}</span>
                </div>
                <button class="week-navigator-button" @click="changeDay(7)">
                    <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="css-i6dzq1"
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
            <div
                class="nav-wrapper"
                v-if="medians_calendar_options.view_type === 'day'"
            >
                <button class="week-navigator-button" @click="changeDay(-1)">
                    <svg
                        style="transform: rotate(180deg)"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="css-i6dzq1"
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div>
                    <span>{{
                        medians_calendar_options.formatDayNavigator(current_day)
                    }}</span>
                </div>
                <button class="week-navigator-button" @click="changeDay(1)">
                    <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="css-i6dzq1"
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>

        <medians-calendar-week-view 
            :events="medians_calendar_events" 
            v-if="showCalendar" 
            :key="medians_calendar_events" 
            :current_day="current_day" 
            :devices="devices" 
            @update-event="updateEvent"
            />


    </div>
</template>
<script>
import Vue from 'vue';
import moment from 'moment';

import {
    cloneObject,
    addMinutes,
    addDays,
    getTime,
    endOfWeek,
    generateUUID,
    getDatelessHour,
    getHourlessDate,
    startOfWeek,
} from './utils.js';

export default {
    components: {
        MediansCalendarWeekView: () => import('./medians-calendar-weekview.vue'),
    },
    props: {
        // this provided array will be kept in sync
        devices: {
            required: true,
            type: Array,
            validator: function(val) {
                return  Array.isArray(val) || typeof val === 'object';
            },
        },
        
        // this provided array will be kept in sync
        settings: {
            required: false,
            type: Array | Object,
        },
        
        // use this to enable/disable stuff which
        // are supported by MediansCalendar itself
        configuration: {
            type: Object,
            required: false,
            validator: function(val) {
                return typeof val === 'object';
            },
        },
    },
    data() {
        return {
            showCalendar: true,
            showPopup:false,
            showModal:false,
            showCart:false,
            showConfirm:false,
            showBooking:false,
            activeItem:{},
            events:[],
            current_day: getHourlessDate(),
            default_options: {
                events_url: '/',
                cell_height: 10,
                scrollToNow: false,
                hourlySelection: false,
                start_day: getHourlessDate(),
                view_type: 'week',
                style: 'material_design',
                now: new Date(),
                military_time: true,
                read_only: false,
                day_starts_at: 0,
                day_ends_at: 24,
                time_mode: 'relative',
                overlap: true,
                past_event_creation: true,
                column_minwidth: 200,
                animation_speed: 200,
                formatLeftHours: date => {
                    return getDatelessHour(
                        date,
                        this.configuration.military_time
                    );
                },
                formatDayTitle: date => {
                    let isoDate = new Date(date);
                    let dayName = isoDate.toUTCString().slice(0, 3);
                    let dayNumber = isoDate.getUTCDate();
                    return [dayName, dayNumber];
                },
                formatWeekNavigator: isoDate => {
                    let startDate = startOfWeek(isoDate);
                    let endDate = endOfWeek(isoDate);
                    let startString = startDate.toUTCString().slice(5, 11);
                    let endString = endDate.toUTCString().slice(5, 11);
                    return `${startString} - ${endString}`;
                },
                formatDayNavigator: isoDate => {
                    let day = new Date(isoDate);
                    return day.toUTCString().slice(5, 11);
                },
            },
            medians_calendar_events: null,
            new_appointment: {},
            scrollable: true,
        };
    },
    computed: {
        medians_calendar_options() {
            let options = this.default_options;
            let provided_props = this.configuration;

            let conditions = {
                events_url: val => typeof val != false,
                scrollToNow: val => typeof val === 'boolean',
                hourlySelection: val => typeof val === 'boolean',
                start_day: val => !isNaN(Date.parse(val)),
                view_type: val => ['week', 'day'].includes(val),
                cell_height: val => !isNaN(val),
                style: val => ['material_design', 'flat_design'].includes(val),
                military_time: val => typeof val === 'boolean',
                read_only: val => typeof val === 'boolean',
                day_starts_at: val =>
                    typeof val === 'number' && val >= 0 && val <= 24,
                day_ends_at: val =>
                    typeof val === 'number' && val >= 0 && val <= 24,
                hide_dates: val => Array.isArray(val),
                hide_days: val =>
                    Array.isArray(val) && !val.find(n => typeof n !== 'number'),
                overlap: val => typeof val === 'boolean',
                past_event_creation: val => typeof val === 'boolean',
                column_minwidth: val => typeof val === 'number',
                animation_speed: val => typeof val === 'number',
            };
            for (let key in provided_props) {
                if (
                    conditions.hasOwnProperty(key) &&
                    conditions[key](provided_props[key])
                ) {
                    options[key] = provided_props[key];
                }
            }
            return options;
        },
    },
    created() {
        this.current_day = this.medians_calendar_options.start_day;
        
        if (!this.$medians_calendar) {
            Vue.prototype.$medians_calendar = {};
        }

        this.$medians_calendar.getEvents = () => this.medians_calendar_events;

        this.$medians_calendar.updateEvents = payload => this.loadEvents();
    },
    provide() {
        const provider = {};
        Object.defineProperty(provider, 'medians_calendar_options', {
            enumerable: true,
            get: () => this.medians_calendar_options,
        });
        Object.defineProperty(provider, 'medians_calendar_events', {
            enumerable: true,
            get: () => this.medians_calendar_events,
        });
        return provider;
    },
    mounted()
    {
        this.loadEvents();
    },
    methods: {
        getTime,
        changeDay(numDays) {
            this.current_day = addDays(this.current_day, numDays).toISOString();
            setTimeout(() => this.reloadEvents());
        },
        
        

        /**
         * Update event data
         */
        updateInfo(activeItem)
        {
            this.$emit('update-info', activeItem)
            return this;
        },


        show_modal(item = null){
            this.$emit('show_modal', item);
        },

        show_event(item = null){
            this.$emit('show_event', item);
        },

        addTime(time, minutes = 0)
        {
            return moment(time).add(minutes, 'minutes');
        },
        dateTime(date)
        {
            return  moment(date).format('HH:mm');
        },
        dateText(date)
        {
            return moment(date).format('YYYY-MM-DD');
        },

        
        /** 
         * Set active item
         * 
         */
        setNewItem(newEvent)
        {
            this.$emit('set-new-event', newEvent)
            return this;
        },


        /** 
         * Set active item
         * '
         */
        setActiveItem(props)
        {
            this.$emit('set-active-event', props)
            return this;
        },


        /** 
         * Set active item
         * '
         */
        setEvent(props)
        {
            this.$emit('set-event', props)
            return this;
        },

        /**
         * Update event data
         */
        storeInfo(activeItem)
        {
            this.submit('Event.create', activeItem)
        },


        /**
         * Update event data
         */
        updateEvent(event, device, cellData)
        {
            this.$emit('update-event', event, device, cellData)
            return this;
        },

        

        /**
         * Update event data
         */
        submit(type, newitem = null) {

            this.$emit('submit', type, newitem)
        },

        
        hidePopup(reload = true)
        {
            this.showBooking = false;
            this.showModal = false;
            this.showConfirm = false;
            if (reload){
                this.reloadEvents();
            }

        },

        async reloadEvents()
        {
            this.showCalendar = false
            return await this.loadEvents().then(response=>{
                this.showCalendar = true
            });
        },
        /**
         * Load events 
         */
        async loadEvents()
        {
            return await this.handleGetRequest(this.medians_calendar_options.events_url+ '?start='+this.current_day+'&end='+addDays(this.current_day, 1).toISOString()).then(response => {
                this.medians_calendar_events = response;
                return this;
            });
        } ,

        async handleGetRequest(url) {

            // Demo json data
            return await this.$parent.handleGetRequest(url);
        },

        async handleRequest(params, url='/') {
            return await this.$parent.handleRequest(params, url);
        },

        log(data)
        {
            this.$parent.log(data);
        },

        __(i)
        {
            return this.$parent.__(i);
        },

    },
};
</script>
<style lang="scss" src="./main.scss"></style>
