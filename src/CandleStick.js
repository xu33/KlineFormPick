// Sprite
class CandleStick {
  constructor(painter, context) {
    this.context = context;
    this.x = 0;
    this.y = 0;
    this.yHigh = 0;
    this.yLow = 0;
    this.width = 0;
    this.height = 0;
    this.color = '';
    this.painter = painter;
  }

  paint() {
    this.painter.paint(this, this.context);
  }

  update({ x, y, yHigh, yLow, width, height, color }) {
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.yHigh = parseInt(yHigh) + 0.5;
    this.yLow = parseInt(yLow) + 0.5;
    this.width = parseInt(width);
    this.height = parseInt(height);
    this.color = color;
  }
}

// Painter
export const CandleStickPainter = {
  paint: function(sprite, context) {
    let x = sprite.x + sprite.width / 2;
    x = parseInt(x) + 0.5;

    // 影线
    context.beginPath();
    context.moveTo(x, sprite.yHigh);
    context.lineTo(x, sprite.yLow);
    context.strokeStyle = sprite.color;
    context.stroke();
    context.closePath();

    // 实体
    context.fillStyle = sprite.color;
    context.rect(sprite.x, sprite.y, sprite.width, sprite.height);
    context.fill();
  }
};

export default CandleStick;
