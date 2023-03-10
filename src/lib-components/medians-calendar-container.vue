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

        <medians-calendar-week-view :events="medians_calendar_events" v-if="showCalendar" :key="current_day" :current_day="current_day" :devices="devices" />


        <div v-if="showPopup">
            <div v-if="showModal && activeItem && !activeItem.id" class="fixed top-0 left-0 w-full h-full"  style="z-index: 99;">
                <div class="absolute top-0 left-0 w-full h-full" @click="hidePopup" style="background: rgba(0,0,0,.6);"></div>
                <div class="left-0 right-0 fixed mx-auto w-full " style="max-width: 600px; z-index: 99;" >
                    <div class="relative h-full ">
                        <calendar_new_item :modal="activeItem" :games="activeItem.device ? activeItem.device.games : []"></calendar_new_item>
                    </div>
                </div>
            </div>  

            <div v-if="showModal && activeItem && activeItem.id" class="fixed top-0 left-0 w-full h-full"  style="z-index: 99;">
                <div class="absolute top-0 left-0 w-full h-full" @click="hidePopup" style="background: rgba(0,0,0,.6);"></div>
                <div class="left-0 right-0 fixed mx-auto w-full " style="max-width: 600px; z-index: 99;" >
                    <div class="relative h-full ">

                        <!-- Confirm overlay -->
                        <div class="top-20 relative mx-auto w-full bg-white p-6 rounded-lg" style="max-width: 600px; z-index: 99;" v-if="showConfirm">
                            
                            <div class="bg-blue-200 rounded-md py-2 px-4" role="alert">
                                <strong v-text="__('confirm')"></strong> <span v-text="__('confirm_complete_booking')"></span> 
                                <button @click="showConfirm = false" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>

                            <div  class="my-2 cursor-pointer w-full text-white  font-semibold py-2 border-b border-gray-200">
                                <label @click="activeItem.status = 'completed'; submit('Event.update', activeItem)" class="w-32 mx-auto py-2 rounded-lg bg-gradient-primary block text-center cursor-pointer" v-text="__('confirm')"></label>
                            </div>

                        </div>
                        
                        <calendar_active_item :modal="activeItem"></calendar_active_item>
                    </div>
                </div>
            </div>  

            <div v-if="showBooking && activeItem" class="fixed top-0 left-0 w-full h-full"  style="z-index: 99;">
                <div class="absolute top-0 left-0 w-full h-full" @click="hidePopup" style="background: rgba(0,0,0,.6);"></div>
                <div class="left-0 right-0 fixed mx-auto w-full " style="max-width: 600px; z-index: 99;" >
                    <div class="relative h-full ">
                        <calendar_modal :modal="activeItem"></calendar_modal>
                    </div>
                </div>
            </div>  
        </div>

        <div class="w-full h-full fixed top-0 left-0" v-if="showCart" style="z-index:999">
            
            <div v-if="showCart" @click="showCart = false ; hidePopup" class="fixed h-full w-full top-0 left-0 bg-gray-800" style="opacity: .6; z-index:9"></div>

            <side_cart  v-if="showCart" ref="side_cart" :setting="settings" :currency="settings.currency"></side_cart>

        </div>
    </div>
</template>
<script>
import Vue from 'vue';

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
        
        this.loadEvents();

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
    methods: {
        getTime,
        changeDay(numDays) {
            this.current_day = addDays(this.current_day, numDays).toISOString();
            setTimeout(() => this.reloadEvents());
        },
        addAppointment(popup_info) {
            let payload = {
                data: {
                    title: this.new_appointment.title,
                    description: this.new_appointment.description,
                },
                from: popup_info.start_time,
                to: popup_info.end_time,
            };

            this.$medians_calendar.closePopups();
            this.clearFormData();
        },
        clearFormData() {
            this.new_appointment = {
                description: null,
                title: null,
            };
        },
        closePopups() {
            this.$medians_calendar.closePopups();
        },

        addToCart(activeItem)
        {
            let item = {};
            this.showCart = true;
            if (activeItem)
            {
                item.id = activeItem.id;
                item.device = activeItem.device;
                item.price = activeItem.price;
                item.duration_time = activeItem.duration_time;
                item.duration_hours = activeItem.duration_hours;
                item.subtotal = activeItem.subtotal;
                item.game = activeItem.game;
                item.products = activeItem.products;
            }
            // this.$refs.side_cart.showCart = true
            // this.$parent.showSide = false;
            this.hidePopup(false);
            var t = this;

            setTimeout(function () {
                t.$refs.side_cart ? t.$refs.side_cart.addToCart(item) : null;
            }, 1000)
        },
        /**
         * Update event data
         */
        updateInfo(activeItem)
        {
            this.showPopup = false; 
            this.showPopup = true

            return this;
        } ,

        log(data)
        {
            this.$parent.log(data);
        },

        show_modal(item = null){
            this.showPopup = false; 
            if (item)
            {
                if (item.id && item.status && item.status == 'active')
                    this.setActiveItem(item);

                if (item.status && item.status == 'completed')
                    this.show_event(item);

                if (item.status && item.status == 'paid')
                    this.show_event(item);

                if (!item.id)
                    this.setNewItem(item);
            }

            this.showPopup = true; 

        },

        show_event(item = null){
            this.showModal = false;
            this.setEvent(item);
            this.showBooking = true;
        },

        addTime(time, minutes = 0)
        {
            return addMinutes(new Date(time), minutes);
        },
        dateTime(date)
        {
            let d = new Date(date).toISOString();
            var datestring = (d.slice(11, 16));
            return datestring;
        },
        dateText(date)
        {
            let d = new Date(date).toISOString();
            var datestring = d.slice(0, 10);
            return datestring;
        },

        /** 
         * Set active item
         * 
         */
        setNewItem(newEvenet)
        {
            if (newEvenet.ending_cell.value === newEvenet.starting_cell.value)
            {
                let d = this.addTime(newEvenet.ending_cell.value, 60);
                newEvenet.ending_cell.value = this.dateText(d)+'T'+this.dateTime(d)+':00.000Z';
            }

            this.activeItem = cloneObject(newEvenet)
            this.games = newEvenet.device ? newEvenet.device.games : []
            this.activeItem.device_id = newEvenet.device ? newEvenet.device.id : 0
            this.activeItem.start = newEvenet.starting_cell ? this.dateTime(newEvenet.starting_cell.value) : null
            this.activeItem.start_time = newEvenet.starting_cell ? newEvenet.starting_cell.time  : null
            this.activeItem.end = newEvenet.ending_cell ? this.dateTime(newEvenet.ending_cell.value)  : null
            this.activeItem.end_time = newEvenet.ending_cell ? newEvenet.ending_cell.time  : null
            this.activeItem.date = newEvenet.starting_cell ? this.dateText(newEvenet.starting_cell.value)  : null
            this.activeItem.booking_type = 'single'
            this.showModal = true
            return this;
        },


        /** 
         * Set active item
         * '
         */
        setActiveItem(props)
        {
            this.activeItem = cloneObject(props)
            this.games = props.device ? props.device.games : []
            this.activeItem.startStr = props.start
            this.activeItem.start = props.starting_cell ? this.dateTime(props.starting_cell.value) : null
            this.activeItem.start_time = props.starting_cell ? props.starting_cell.time  : null
            this.activeItem.end = props.ending_cell ? this.dateTime(props.ending_cell.value)  : null
            this.activeItem.end_time = props.ending_cell ? props.ending_cell.time  : null
            this.activeItem.date = props.starting_cell ? this.dateText(props.starting_cell.value)  : null
            this.activeItem.subtotal = this.subtotal();
            this.showModal = true
            return this;
        },


        /** 
         * Set active item
         * '
         */
        setEvent(props)
        {
            this.activeItem = cloneObject(props)
            this.activeItem.startStr = props.start
            this.activeItem.subtotal = this.subtotal();
            this.showModal = true
            return this;
        },

        /**
         * Update event data
         */
        storeInfo(activeItem)
        {
            this.submit('Event.create', activeItem)
        } ,
        /**
         * Update event data
         */
        submit(type, newitem = null) {

            let item = newitem ? newitem : this.activeItem;

            let request_type = type.includes('create') ? 'update' : 'create';

            const params = new URLSearchParams([]);
            item.start_time = this.current_day+ ' ' +item.start
            item.end_time = this.current_day+ ' ' +item.end
            params.append('type', type);
            params.append('params[event]', JSON.stringify(item));
            this.handleRequest(params, '/api/'+request_type).then(data => { 
                this.hidePopup();
            });
        },

        subtotal()
        {
            let price = this.activeItem.device_cost;

            return (Number(price) * Number(this.activeItem.duration_hours)).toFixed(2) ;
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
            return await this.handleGetRequest('/api/calendar_events?start='+this.current_day+'&end='+addDays(this.current_day, 1).toISOString()).then(response => {
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
        __(i)
        {
            return this.$parent.__(i);
        },

    },
};
</script>
<style lang="scss" src="./main.scss"></style>
