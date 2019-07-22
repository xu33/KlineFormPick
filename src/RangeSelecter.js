import { windowToCanvas, highDPIConvert } from './utils';

const STROKE_COLOR = '#FE841D';
const FILL_COLOR = 'rgba(254,132,29,0.20)';
// const MIN_WIDTH = 40;

function drawCircle({ context, x, y, radius, fillStyle, withShadow = false }) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, 1);

  context.save();
  if (withShadow) {
    context.shadowBlur = 4;
    context.shadowColor = 'rgba(17,17,17,0.30)';
  }

  context.fillStyle = fillStyle;
  context.fill();
  context.restore();
  context.closePath();
}

// const CirclePainter = {
//   paint: function(sprite, context) {
//     context.beginPath();
//     context.arc(sprite.x, sprite.y, sprite.radius);
//   }
// };

class CircleSprite {
  constructor(x, y, context) {
    this.x = x;
    this.y = y;
    this.lastX = x;
    this.lastY = y;
    this.outerRadius = 15;
    this.innerRadius = 9;
    this.context = context;
  }

  update(x) {
    this.x = x;
  }

  updateLast() {
    console.log(this.x, this.lastX);
    this.lastX = this.x;
  }

  render(context) {
    // 外环
    drawCircle({
      context,
      x: this.x,
      y: this.y,
      radius: this.outerRadius,
      withShadow: true,
      fillStyle: '#FFF'
    });

    // 内环
    drawCircle({
      context,
      x: this.x,
      y: this.y,
      radius: this.innerRadius,
      fillStyle: STROKE_COLOR
    });
  }
}

class RangeSelecter {
  constructor({ container, width, height, scale, onSelect, onChange }) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    // this.context = highDPIConvert(this.canvas, width, height);
    this.context = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvasWidth = width;
    this.canvasHeight = height;

    this.scale = scale;

    console.log('step:', this.scale.step());
    var step = this.scale.step();

    this.x1 = width - step * 5;
    this.x2 = width;
    this.outerRadius = 15;
    this.innerRadius = 9;
    this.container.appendChild(this.canvas);
    this.onSelect = onSelect || function() {};
    this.onChange = onChange || function() {};

    this.circles = new Array(2);
    this.initCircles();
    this.initEventHandlers();
  }

  handleTouchStart = e => {
    var canvas = this.canvas;
    var context = this.context;
    if (e.touches.length > 1) {
      return;
    }

    this.MIN_WIDTH = this.scale.step() * 5;

    var touch = e.touches[0];
    var loc = windowToCanvas(canvas, touch.pageX, touch.pageY);

    for (var i = 0; i < this.circles.length; i++) {
      var o = this.circles[i];
      context.beginPath();
      context.arc(o.x, o.y, o.outerRadius, 0, Math.PI * 2, 1);

      if (context.isPointInPath(loc.x, loc.y)) {
        this.activeSprite = o;
        this.activeIndex = i;
        this.touchstart = loc;
        break;
      }

      context.closePath();
    }

    if (this.activeSprite != null) {
      this.onSelect();
    }
  };

  handleTouchMove = e => {
    if (!this.activeSprite) {
      return;
    }

    var canvas = this.canvas;
    var circles = this.circles;
    var touchstart = this.touchstart;
    var activeSprite = this.activeSprite;
    var activeIndex = this.activeIndex;
    var MIN_WIDTH = this.MIN_WIDTH;
    var touch = e.touches[0];
    var loc = windowToCanvas(canvas, touch.pageX, touch.pageY);
    var dx = loc.x - touchstart.x;
    var leftSide, rightSide;
    if (activeIndex === 0) {
      leftSide = activeSprite;
      rightSide = circles[1];
    } else {
      leftSide = circles[0];
      rightSide = activeSprite;
    }
    var step = this.scale.step();

    var stepCount = dx / step;

    if (Math.abs(stepCount) < 1) {
      return;
    }

    var cacheX = activeSprite.x;
    var count = stepCount > 0 ? Math.floor(stepCount) : Math.ceil(stepCount);
    var deltaX = count * step;
    activeSprite.update(activeSprite.lastX + deltaX);

    var widthBetween = rightSide.x - leftSide.x;
    if (widthBetween < MIN_WIDTH) {
      activeSprite.update(cacheX);

      if (activeSprite == leftSide) {
        leftSide.update(activeSprite.lastX + deltaX);
        rightSide.update(leftSide.x + MIN_WIDTH);
      } else {
        rightSide.update(activeSprite.lastX + deltaX);
        leftSide.update(rightSide.x - MIN_WIDTH);
      }

      if (leftSide.x < 0) {
        leftSide.update(0);
        rightSide.update(leftSide.x + MIN_WIDTH);
      }

      if (rightSide.x > this.canvasWidth) {
        rightSide.update(this.canvasWidth);
        leftSide.update(rightSide.x - MIN_WIDTH);
      }
    } else {
      if (leftSide.x < 0) leftSide.update(0);
      if (rightSide.x > this.canvasWidth) rightSide.update(this.canvasWidth);
    }

    this.render();
  };

  handleTouchEnd = () => {
    if (!this.activeSprite) {
      return;
    }

    this.circles.forEach(c => c.updateLast());
    this.activeSprite = null;
    this.activeIndex = -1;
    this.touchstart = null;
  };

  initEventHandlers() {
    var container = this.container;
    var captureOption = {
      capture: true
    };

    this.activeSprite = null;
    this.activeIndex = -1;
    this.touchstart = null;

    container.addEventListener(
      'touchstart',
      this.handleTouchStart,
      captureOption
    );

    container.addEventListener(
      'touchmove',
      this.handleTouchMove,
      captureOption
    );

    container.addEventListener('touchend', this.handleTouchEnd, captureOption);
  }

  initCircles() {
    var y = this.canvasHeight / 2 - this.outerRadius;
    var c1 = new CircleSprite(this.x1, y);
    var c2 = new CircleSprite(this.x2, y);
    this.circles[0] = c1;
    this.circles[1] = c2;
  }

  renderPickers() {
    var context = this.context;
    console.log(this.circles.length);
    this.circles.forEach(function(c) {
      c.render(context);
    });
  }

  renderRect() {
    const x1 = this.circles[0].x;
    const x2 = this.circles[1].x;
    const context = this.context;
    const width = x2 - x1;
    context.beginPath();
    context.save();
    context.rect(x1 + 0.5, -2 + 0.5, width, this.canvasHeight + 2);

    context.fillStyle = FILL_COLOR;
    context.strokeStyle = STROKE_COLOR;
    context.strokeWidth = 2;

    context.fill();
    context.stroke();
    context.restore();

    this.x1 = x1;
    this.x2 = x2;
  }

  render() {
    console.log('render fired');
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.renderRect();
    this.renderPickers();
  }
}

export default RangeSelecter;
