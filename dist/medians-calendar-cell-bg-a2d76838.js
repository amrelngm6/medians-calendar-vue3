import { j as getLocaleTime, c as cloneObject, b as _objectSpread2, d as __vue_normalize__, e as __vue_create_injector__ } from './index-34847f35.js';
import 'vue';
import 'moment';

var script = {
  date: function date() {
    return {
      showBgSelect: false,
      showBgHover: false
    };
  },
  props: ['device', 'creator', 'index', 'cellData', 'constructedEvents', 'temporaryEvent'],
  inject: ['medians_calendar_options'],
  components: {
    MediansCalendarEvent: function MediansCalendarEvent() {
      return import('./medians-calendar-event-37182cc0.js');
    }
  },
  computed: {},
  methods: {
    dropStart: function dropStart(cellData) {
      this.$emit('dragEnd', cellData, this.device);
    },
    mouseDown: function mouseDown() {
      // user mouse got depressed while outside medians-calendar-cells
      // came back in and clicked while the creator was on
      if (!!this.creator.creating) {
        this.mouseUp();
        return;
      }
      var _this$medians_calenda = this.medians_calendar_options,
        read_only = _this$medians_calenda.read_only,
        overlap = _this$medians_calenda.overlap,
        past_event_creation = _this$medians_calenda.past_event_creation;
      if (read_only) return;

      // if past_event_creation is set to false, check if cell value is
      // before current time
      if (past_event_creation === false) {
        var now = getLocaleTime(new Date());
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
      var payload = {
        creating: true,
        original_starting_cell: cloneObject(this.cellData),
        starting_cell: cloneObject(this.cellData),
        current_cell: cloneObject(this.cellData),
        ending_cell: cloneObject(this.cellData)
      };
      this.$emit('select', payload);
    },
    mouseMove: function mouseMove() {
      // same guards like in the mouseDown function
      var _this$medians_calenda2 = this.medians_calendar_options,
        read_only = _this$medians_calenda2.read_only,
        overlap = _this$medians_calenda2.overlap;
      if (read_only) return;
      if (this.creator && !this.creator.creating) return;
      var _this$creator = this.creator,
        starting_cell = _this$creator.starting_cell,
        original_starting_cell = _this$creator.original_starting_cell,
        creating = _this$creator.creating;

      // direction of scroll
      var going_down = this.cellData.index >= starting_cell.index && starting_cell.index === original_starting_cell.index;
      if (creating) {
        var payload = _objectSpread2(_objectSpread2({}, this.creator), {}, {
          current_cell: this.cellData,
          ending_cell: this.cellData,
          direction: going_down ? 'normal' : 'reverse'
        });
        this.$emit('select', payload);
      }
    },
    mouseUp: function mouseUp() {
      this.showBgSelect = false;
      this.$emit('initiatePopup');
    },
    resetCreator: function resetCreator() {
      this.$emit('reset');
    },
    isAnHour: function isAnHour(index) {
      if (this.medians_calendar_options.hourlySelection) {
        return true;
      } else {
        return (index + 1) % (60 / 10) === 0;
      }
    },
    show_modal: function show_modal() {
      var item = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      this.$parent.show_modal(item);
    },
    log: function log(data) {
      this.$parent.log(data);
    }
  }
};

/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function __vue_render__() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _vm.cellData.visible ? _c('div', {
    staticClass: "text-xs hover:text-gray-600 border-gray-100 hover:bg-gray-100 border medians-calendar-cell-bg rounded relative cell-bg",
    class: {
      // selected: selected,
      'is-an-hour': _vm.isAnHour(_vm.index),
      'bg-gray-200': _vm.showBgHover,
      'bg-blue-200': _vm.showBgSelect
      // 'being-created': !!being_created || hasPopups,
    },
    style: "height: " + _vm.medians_calendar_options.cell_height + "px; ",
    on: {
      "mouseover": [function ($event) {
        _vm.showBgHover = true;
      }, function ($event) {
        if ($event.target !== $event.currentTarget) {
          return null;
        }
        return _vm.mouseMove();
      }],
      "mouseout": function mouseout($event) {
        _vm.showBgHover = false;
      },
      "mousedown": function mousedown($event) {
        if ($event.target !== $event.currentTarget) {
          return null;
        }
        return _vm.mouseDown();
      },
      "mouseup": function mouseup($event) {
        return _vm.mouseUp();
      },
      "dragover": [function ($event) {
        $event.preventDefault();
      }, function ($event) {
        _vm.showBgHover = true;
      }],
      "dragenter": function dragenter($event) {
        $event.preventDefault();
      },
      "drop": function drop($event) {
        return _vm.dropStart(_vm.cellData);
      }
    }
  }, [_vm.cellData.value ? _c('div', {
    staticStyle: {
      "pointer-events": "none"
    }
  }, [_c('div', {
    domProps: {
      "textContent": _vm._s(_vm.cellData.value.slice(11, 16))
    }
  })]) : _vm._e()]) : _vm._e();
};
var __vue_staticRenderFns__ = [];

/* style */
var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) return;
  inject("data-v-163d3ceb_0", {
    source: "li{font-size:13px;position:relative}.created-events{height:100%}.cell-bg div{display:none}.cell-bg:active div,.cell-bg:hover div{display:block}ul.building-blocks li{z-index:0;border-bottom:dotted 1px var(--odd-cell-border-color)}ul.building-blocks li.first_of_appointment{z-index:1;opacity:1}ul.building-blocks li.is-an-hour{border-bottom:solid 1px var(--table-cell-border-color)}ul.building-blocks li.has-events{z-index:unset}ul.building-blocks li.being-created{z-index:11}",
    map: undefined,
    media: undefined
  });
};
/* scoped */
var __vue_scope_id__ = undefined;
/* module identifier */
var __vue_module_identifier__ = undefined;
/* functional template */
var __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/__vue_normalize__({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, __vue_create_injector__, undefined, undefined);

export default __vue_component__;
