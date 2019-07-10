import { windowToCanvas } from './utils';

const STROKE_COLOR = '#FE841D';
const FILL_COLOR = 'rgba(254,132,29,0.20)';
const MIN_WIDTH = 40;

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
}

class CircleSprite {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lastX = x;
    this.lastY = y;
    this.outerRadius = 15;
    this.innerRadius = 9;
  }

  update(x) {
    this.x = x;
  }

  updateLast() {
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
  constructor({ container, width, height, onSelect, onChange }) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.context = this.canvas.getContext('2d');
    this.x1 = 100;
    this.x2 = 150;
    this.height = height;
    this.outerRadius = 15;
    this.innerRadius = 9;
    this.container.appendChild(this.canvas);
    this.onSelect = onSelect || function() {};
    this.onChange = onChange || function() {};

    this.circles = new Array(2);
    this.initCircles();
    this.addEvents();
  }

  addEvents() {
    var container = this.container;
    var canvas = this.canvas;
    var context = this.context;
    var circles = this.circles;
    var activeSprite = null;
    var activeIndex = -1;
    var touchstart = null;
    var captureOption = {
      capture: true
    };

    container.addEventListener(
      'touchstart',
      e => {
        if (e.touches.length > 1) {
          return;
        }

        var touch = e.touches[0];
        var loc = windowToCanvas(canvas, touch.pageX, touch.pageY);

        for (var i = 0; i < circles.length; i++) {
          var o = circles[i];
          context.beginPath();
          context.arc(o.x, o.y, o.outerRadius, 0, Math.PI * 2, 1);

          if (context.isPointInPath(loc.x, loc.y)) {
            activeSprite = circles[i];
            activeIndex = i;
            touchstart = loc;
            break;
          }

          context.closePath();
        }

        if (activeSprite != null) {
          this.onSelect();
        }
      },
      captureOption
    );

    container.addEventListener(
      'touchmove',
      e => {
        if (!activeSprite) {
          return;
        }

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

        var cacheX = activeSprite.x;

        activeSprite.update(activeSprite.lastX + dx);

        var widthBetween = rightSide.x - leftSide.x;
        if (widthBetween < MIN_WIDTH) {
          activeSprite.update(cacheX);

          if (activeSprite == leftSide) {
            leftSide.update(activeSprite.lastX + dx);
            rightSide.update(leftSide.x + MIN_WIDTH);
          } else {
            rightSide.update(activeSprite.lastX + dx);
            leftSide.update(rightSide.x - MIN_WIDTH);
          }

          this.render();
        } else {
          this.render();
        }
      },
      captureOption
    );

    container.addEventListener(
      'touchend',
      e => {
        if (!activeSprite) {
          return;
        }

        circles.forEach(c => c.updateLast());
        activeSprite = null;
        activeIndex = -1;
        touchstart = null;
      },
      captureOption
    );
  }

  initCircles() {
    var y = this.height / 2 - this.outerRadius;
    var c1 = new CircleSprite(this.x1, y);
    var c2 = new CircleSprite(this.x2, y);
    this.circles[0] = c1;
    this.circles[1] = c2;
  }

  renderPickers() {
    var context = this.context;
    this.circles.forEach(function(c) {
      c.render(context);
    });
  }

  renderRect() {
    const x1 = this.circles[0].x;
    const x2 = this.circles[1].x;
    const context = this.context;
    const width = x2 - x1;
    context.save();
    context.rect(x1 + 0.5, -2 + 0.5, width, this.height + 2);

    context.fillStyle = FILL_COLOR;
    context.strokeStyle = STROKE_COLOR;
    context.strokeWidth = 2;

    context.fill();
    context.stroke();
    context.restore();

    this.x1 = x1;
    this.x2 = x2;
  }

  update() {}

  render() {
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.renderRect();
    this.renderPickers();
  }
}

export default RangeSelecter;
