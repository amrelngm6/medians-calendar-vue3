<template>
    <div
        class="kalendar-wrapper"
        :class="{
            'no-scroll': !scrollable,
            gstyle: kalendar_options.style === 'material_design',
            'day-view': kalendar_options.view_type === 'day',
        }"
        @touchstart="scrollable = false"
        @touchend="scrollable = true"
    >
        <div class="week-navigator">
            <div
                class="nav-wrapper"
                v-if="kalendar_options.view_type === 'week'"
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
                        kalendar_options.formatWeekNavigator(current_day)
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
                v-if="kalendar_options.view_type === 'day'"
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
                        kalendar_options.formatDayNavigator(current_day)
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
        <kalendar-week-view :devices="devices" :current_day="current_day" />
        <portal to="event-creation" class="slotable">
            <div slot-scope="information" class="creating-event">
                <slot name="creating-card" :event_information="information">
                    <h4 class="appointment-title" style="text-align: left;">
                        New Appointment
                    </h4>
                    <span class="time">
                        {{ getTime(information.start_time) }}
                        -
                        {{ getTime(information.end_time) }}
                    </span>
                </slot>
            </div>
        </portal>
        <portal to="event-popup-form" class="slotable">
            <div slot-scope="information" class="popup-event">

                
                <slot name="popup-form" :popup_information="information">
                
                   <input
                        v-model="activeItem.title"
                        type="text"
                        name="title"
                        placeholder="Title"
                        style="width: 100%;"
                    />
                    <div class="buttons">
                        <button class="cancel" @click="closePopups()">
                            Cancel
                        </button>
                        <button @click="addAppointment(information)">
                            Save
                        </button>
                    </div>
                </slot>
            </div>
        </portal>


        <div v-if="showModal && activeItem" class="fixed top-0 left-0 w-full h-full"  style="z-index: 99;">
            <div class="absolute top-0 left-0 w-full h-full" @click="show_modal" style="background: rgba(0,0,0,6);"></div>
            <div class="left-0 right-0 fixed mx-auto w-full " style="max-width: 600px; z-index: 99;" >
                <div class="relative h-full ">
                    <calendar_active_item :modal="activeItem"></calendar_active_item>
                </div>
            </div>
        </div>  

    </div>
</template>
<script>
import Vue from 'vue';
const axios = require('axios').default;

import {
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
        KalendarWeekView: () => import('./kalendar-weekview.vue'),
    },
    props: {
        devices: {
            required: true,
            type: Array,
            validator: function(val) {
                return Array.isArray(val);
            },
        },
        // this provided array will be kept in sync
        events: {
            required: true,
            type: Array,
            validator: function(val) {
                return Array.isArray(val);
            },
        },
        // use this to enable/disable stuff which
        // are supported by Kalendar itself
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
            showModal: false,
            current_day: getHourlessDate(),
            default_options: {
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
                    this.log(day.toUTCString().slice(5, 16));
                    this.log(day.toUTCString().slice(5, 11));
                    return day.toUTCString().slice(5, 11);
                },
            },
            kalendar_events: null,
            activeItem: {},
            scrollable: true,
        };
    },
    computed: {
        kalendar_options() {
            let options = this.default_options;
            let provided_props = this.configuration;

            let conditions = {
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
        this.current_day = this.kalendar_options.start_day;
        this.loadEvents();
        // this.kalendar_events = .events.map(event => ({
        //     ...event,
        //     id: event.id || generateUUID(),
        // }));

        if (!this.$kalendar) {
            Vue.prototype.$kalendar = {};
        }


        this.$kalendar.reloadEvents = () => this.loadEvents();

        this.$kalendar.getEvents = () => this.kalendar_events;

        this.$kalendar.updateEvents = () => this.loadEvents().kalendar_events;
        


    },
    provide() {
        const provider = {};
        Object.defineProperty(provider, 'kalendar_options', {
            enumerable: true,
            get: () => this.kalendar_options,
        });
        Object.defineProperty(provider, 'kalendar_events', {
            enumerable: true,
            get: () => this.kalendar_events,
        });
        return provider;
    },
    methods: {
        show_modal(item= null)
        {
            this.showModal = this.showModal ? false : true;
            this.activeItem = item;
        },
        getTime,
        changeDay(numDays) {
            this.current_day = addDays(this.current_day, numDays).toISOString();
            setTimeout(() => this.loadEvents().$kalendar.buildWeek());
        },
        addAppointment(popup_info) {
            let payload = {
                data: {
                    title: this.activeItem.title,
                    description: this.activeItem.description,
                },
                from: popup_info.start_time,
                to: popup_info.end_time,
            };

            this.$kalendar.addNewEvent(payload);
            this.$kalendar.closePopups();
            this.clearFormData();
        },
        clearFormData() {
            this.activeItem = {
                description: null,
                title: null,
            };
        },
        closePopups() {
            this.$kalendar.closePopups();
        },


        /**
         * Update event data
         */
        updateInfo(activeItem)
        {
            this.showModal = false; 
            this.reloadEvents();
            this.showModal = true

            return this;
        } ,

        log(data)
        {
            this.$parent.log(data);
        },

        /**
         * Load events 
         */
        async loadEvents()
        {
            return await this.handleGetRequest('/api/calendar_events?start='+this.current_day+'&end='+addDays(this.current_day, 1).toISOString()).then(response => {
                this.log('response')
                this.log(response)
                this.kalendar_events = response;
                return this;
            });
        } ,

        async handleGetRequest(url) {

            // Demo json data
            return await axios.get(url).then(response => 
            {
                if (response.data)
                    return response.data;
                else 
                    return response;
            });
        },

        async handleRequest(params, url='/') {
            return await this.$parent.handleRequest(params, url);
        },
        __(i)
        {
            return this.$parent.__(i);
        },

    },


};
</script>
<style lang="scss" src="./main.scss"></style>
