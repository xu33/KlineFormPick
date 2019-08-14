import $ from 'jquery';
import { windowToElement } from './utils';
import './RangeSelectorDOM.css';
const STROKE_COLOR = '#FE841D';
const FILL_COLOR = 'rgba(254,132,29,0.20)';
const DEFAULT_STICK_COUNT = 20;

class RangeSelectorDOM {
  constructor({ container, width, scale, onSelect, onSelectEnd, onChange }) {
    this.container = container;
    this.element = $('<div></div>');
    this.element.addClass('range_selector_dom');
    // this.element.css('width', 100);
    this.width = width;
    this.scale = scale;
    let step = this.scale.step();

    this.x1 = width - step * DEFAULT_STICK_COUNT;
    this.x2 = width;
    this.rangeWidth = this.x2 - this.x1;

    this.element.css({
      width: this.rangeWidth,
      left: this.x1
    });

    this.step = step;

    this.leftHandle = $('<div><div class="circle"></div></div>').addClass(
      'left_handle'
    );
    this.rightHandle = $('<div><div class="circle"></div></div>').addClass(
      'right_handle'
    );
    this.element.append(this.leftHandle);
    this.element.append(this.rightHandle);

    $(container).append(this.element);

    this.onSelect = onSelect || function() {};
    this.onSelectEnd = onSelectEnd || function() {};
    this.onChange = onChange || function() {};

    this.onChange(this, [this.x1, this.x2]);

    this.bindEvents();
  }

  handleTouchStart(type, e) {
    var touch = e.touches[0];
    var loc = windowToElement(this.container, touch.pageX, touch.pageY);
    var step = this.scale.step();
    this.touchstart = loc;
    this.type = type;

    this.MIN_WIDTH = step * 10;
    this.MAX_WIDTH = step * 60;

    this.onSelect();

    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.handleTouchEnd);
  }

  handleTouchMove = e => {
    var MIN_WIDTH = this.MIN_WIDTH;
    var MAX_WIDTH = this.MAX_WIDTH;
    var touch = e.touches[0];
    var touchstart = this.touchstart;
    var loc = windowToElement(this.container, touch.pageX, touch.pageY);

    var type = this.type;
    var dx = loc.x - touchstart.x;
    var step = this.scale.step();
    var stepCount = dx / step;

    if (Math.abs(stepCount) < 1) {
      return;
    }

    this.touchstart = loc;

    var count = stepCount > 0 ? Math.floor(stepCount) : Math.ceil(stepCount);
    var deltaX = count * step;

    if (type === 'left') {
      let x1 = this.x1 + deltaX;
      let x2 = this.x2;

      if (x1 < 0) {
        x1 = 0;
      }

      let w = x2 - x1;

      if (w < MIN_WIDTH) {
        w = MIN_WIDTH;
        x2 = x1 + w;
      }

      if (w > MAX_WIDTH) {
        w = MAX_WIDTH;
        x1 = x2 - MAX_WIDTH;
        x2 = x1 + w;
      }

      if (x1 + w > this.width) {
        x1 = this.width - w;
        x2 = x1 + w;
      }

      this.element.css({
        left: x1,
        width: w
      });

      this.x1 = x1;
      this.x2 = x2;
    } else if (type === 'right') {
      let x1 = this.x1;
      let x2 = this.x2 + deltaX;

      if (x2 > this.width) {
        x2 = this.width;
      }

      let w = x2 - x1;

      if (w < MIN_WIDTH) {
        w = MIN_WIDTH;
        x1 = x2 - w;
      }

      if (w > MAX_WIDTH) {
        w = MAX_WIDTH;
        x2 = x1 + w;
      }

      if (x1 < 0) {
        x1 = 0;
        x2 = x1 + w;
      }

      if (x1 + w > this.width) {
        x1 = this.width - w;
      }

      this.element.css({
        left: x1,
        width: w
      });

      this.x1 = x1;
      this.x2 = x2;
    }

    this.onChange(this, [this.x1, this.x2]);
  };

  manualUpdate({ x1, x2 }) {
    let rangeWidth = x2 - x1;
    this.x1 = x1;
    this.x2 = x2;

    this.element.css({ left: x1, width: rangeWidth });
    // this.onChange(this, [this.x1, this.x2]);
  }

  handleTouchEnd = e => {
    this.touchstart = null;
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    this.onSelectEnd();
  };

  bindEvents() {
    const handleTouchStartLeft = this.handleTouchStart.bind(this, 'left');
    const handleTouchStartRight = this.handleTouchStart.bind(this, 'right');
    this.leftHandle.on('touchstart', handleTouchStartLeft);
    this.rightHandle.on('touchstart', handleTouchStartRight);
  }

  destroy() {
    this.leftHandle.off('touchstart');
    this.rightHandle.off('touchstart');
  }
}

export default RangeSelectorDOM;
