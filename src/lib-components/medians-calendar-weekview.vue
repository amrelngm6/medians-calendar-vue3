<template>
  <div class="calendar-wrap" :style="`--space-between-cols: ${colsSpace}`">
    <div class="sticky-top"  v-if="devices && days">
      <ul class="days">
        <li
          class="day-indicator"
          :key="index"
          v-for="(device, index) in devices || []"
          :class="{ today: _isToday(current_day), 'is-before': isDayBefore(current_day) }"
        >
          <div v-if="device" class="w-full">
            <span class="letters-date">{{
              device.title
            }}</span>
            <span class="number-date w-4 h-4 text-sm">{{
              device.id
            }}</span>
          </div>
        </li>
      </ul>
      <ul class="all-day">
        <span>All Day</span>
        <li
          :key="index"
          v-for="(day, index) in devices || []"
          :class="{ 'all-today': _isToday(current_day), 'is-all-day': false }"
          :style="`height:${medians_calendar_options.cell_height + 5}px`"
        ></li>
      </ul>
    </div>
    <div class="dummy-row" v-if="false">
      <ul class="dummy-days">
        <li
          :key="index"
          v-for="(day, index) in devices || []"
          :style="`height:${medians_calendar_options.cell_height}px`"
        ></li>
      </ul>
    </div>
    <div class="blocks" v-if="hours">
      <div class="calendar-blocks">
        <ul class="hours">
          <li
            class="w-full hour-row-identifier"
            :key="index"
            v-for="(hour, index) in hoursVisible"
            :style="`height:${hourHeight}px`"
          >
            <span class="w-full text-center ">{{ medians_calendar_options.formatLeftHours(hour.value) }}</span>
          </li>
        </ul>
        <div
          v-show="medians_calendar_options.style !== 'material_design'"
          class="hour-indicator-line"
          :style="`top:${passedTime}px`"
        >
          <span class="time-value">{{ passedTime }}</span>
          <span class="line"></span>
        </div>
        <div
        class="w-full flex"
        v-if="days "
        >
        <medians-calendar-days
          :day="days[0]"
          :events="events"
          :column_index="index"
          :device="device"
          class="building-blocks"
          :class="`day-${index + 1}`"
          :key="`day-${current_day}${index}`"
          v-for="(device, index) in devices"
          :passed-time="passedTime"
          :ref="days[0].value.slice(0, 10)+'-day'+index"
        >
        </medians-calendar-days>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import MediansCalendarDays from "./medians-calendar-day.vue";
import myWorker from "@/lib-components/workers";
import {
  getTopDistance ,
  isBefore,
  isToday,
  getHourlessDate,
  addTimezoneInfo,
  getLocaleTime,
} from "./utils";

export default {

  watch: {
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
    events: {
        required: false,
        type: Array,
        validator: function(val) {
            return  Array.isArray(val) || typeof val === 'object';
        },
    },
    current_day: {
      required: true,
      type: String,
      validator: d => !isNaN(Date.parse(d)),
    }
  },
  components: {
    MediansCalendarDays
  },
  created() {
    this.addHelperMethods();
    setInterval(() => (this.medians_calendar_options.now = new Date()), 1000 * 60);
    this.constructWeek();
  },
  inject: ["medians_calendar_options"],
  data: () => ({
    hours: null,
    days: []
  }),
  computed: {
    hoursVisible() {
      if (!this.hours) return [];
      return this.hours.filter(x => !!x.visible);
    },
    colsSpace() {
      return this.medians_calendar_options.style === "flat_design" ? "5px" : "0px";
    },
    hourHeight() {
      return (this.medians_calendar_options.hourlySelection ? 1 : 6) * this.medians_calendar_options.cell_height;
      //this.medians_calendar_options.cell_height * (60 / this.medians_calendar_options.split_value);
      // * this.medians_calendar_options.hour_parts;
    },
    passedTime() {
      let time_obj = new Date();
      return ((getTopDistance(time_obj) / 10) * this.medians_calendar_options.cell_height); 
    }
  },
  methods: {
    _isToday(day) {
      return isToday(day);
    },

    isDayBefore(day) {
      let now = new Date(this.medians_calendar_options.now);
      let formattedNow = getLocaleTime(now.toISOString());
      return isBefore(day, getHourlessDate(formattedNow));
    },
    constructWeek() {
      const date = this.current_day.slice(0, 10);
      const { hide_dates, hide_days, view_type } = this.medians_calendar_options;
      return Promise.all([
        myWorker
          .send("getDays", {
            day: date,
            options: {
              hide_dates,
              hide_days,
              view_type
            }
          })
          .then(reply => {
            this.days = reply; //.slice(0,1);
          }),
        myWorker
          .send("getHours", {
            hourOptions: {
              start_hour: this.medians_calendar_options.day_starts_at,
              end_hour: this.medians_calendar_options.day_ends_at
            }
          })
          .then(reply => {
            // Handle the reply
            this.hours = reply;
          })
      ]);
    },
    addHelperMethods() {
      this.$medians_calendar.buildWeek = () => {
        this.constructWeek();
      };
      
      this.$medians_calendar.closePopups = () => {
        let refs = this.days.map(day => day.value.slice(0, 10));
        refs.forEach(ref => {
          this.$refs[ref] && this.$refs[ref][0] ? this.$refs[ref][0].clearCreatingLeftovers() : null;
        });
      };
    },

        show_modal(item = null){
            this.$parent.show_modal(item);
        },
        log(data)
        {
            this.$parent.log(data);
        },
  }
};
</script>
<style lang="scss">
$blue: #5fb3f2;
$lblue: #d6eefc;
$dblue: #3d79b4;
$lightgrey: #c7c9d5; //$lightgrey: #F5F4F5;
$grey: #c7c9d5; //#C1C4C8;
$a-grey: #666;
$border-color: transparent;
$theme-color: #e5e5e5;

.calendar-wrap {
  display: flex;
  flex-direction: column;

  ul {
    list-style: none;
    padding: 0px;

    > li {
      display: flex;
    }
  }
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: white;

  .days {
    margin: 0px;
    display: flex;
    margin-left: 55px;

    li {
      display: inline-flex;
      align-items: flex-end;
      padding-top: 10px;
      flex: 1;
      font-size: 1.1rem;
      color: $a-grey;
      font-weight: 300;
      margin-right: var(--space-between-cols);
      border-bottom: solid 1px #e5e5e5;
      padding-bottom: 5px;
      position: relative;
      font-size: 18px;

      span {
        margin-right: 3px;
      }

      span:first-child {
        font-size: 20px;
        font-weight: 500;
      }
    }

    .today {
      border-bottom-color: var(--main-color);
      color: var(--main-color) !important;
    }

    .today::after {
      content: "";
      position: absolute;
      height: 2px;
      bottom: 0;
      left: 0;
      width: 100%;
      background-color: var(--main-color);
    }
  }

  .all-day {
    display: flex;
    margin-bottom: 0px; //border-top: solid 1px #e5e5e5;
    margin-top: 0px;
    border-bottom: solid 2px #e5e5e5;

    span {
      display: flex;
      align-items: center;
      padding: 0px 5px;
      width: 55px;
      font-weight: 500;
      font-size: 0.8rem;
      color: darken($grey, 5);
      text-transform: lowercase;
    }

    li {
      flex: 1; //border-right: solid 5px $border-color;
      margin-right: var(--space-between-cols);

      &.all-today {
        background-color: #fef4f4;
      }
    }
  }
}

.dummy-row {
  display: flex;
  padding-left: 55px;

  ul {
    display: flex;
    flex: 1;
    margin: 0px;
  }

  li {
    flex: 1;
    height: 15px; //border-right: solid 5px $border-color;
    margin-right: var(--space-between-cols);
    border-bottom: solid 1px #e5e5e5;
  }
}

.blocks {
  display: flex;
  position: relative;
  height: 100%;

  ul {
    margin-top: 0px;
  }

  .building-blocks {
    flex: 1;
    margin-right: var(--space-between-cols);
    margin-bottom: 0px;
    display: flex;
    flex-direction: column;
  }

  .calendar-blocks {
    width: 100%;
    display: flex;
    position: relative;
  }
}

.hours {
  display: flex;
  flex-direction: column;
  color: darken($grey, 5);
  font-weight: 500;
  font-size: 0.85rem;
  width: 55px;
  height: 100%;
  margin-bottom: 0px;

  li {
    color: var(--hour-row-color);
    border-bottom: solid 1px $border-color;
    padding-left: 8px;

    span {
      margin-top: -8px;
    }

    &:first-child span {
      visibility: hidden;
    }
  }
}
</style>

<style lang="css">
	.rtl .medians-calendar-wrapper.gstyle .sticky-top .days
	{ 
		padding-left: 0;
		padding-right: 55px;
	}
</style>