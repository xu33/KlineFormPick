const Painter = {
  paint: function(sprite, context) {
    let { points, color } = sprite;

    context.save();
    context.strokeStyle = color;
    context.beginPath();
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      if (i == 0) {
        context.moveTo(p.x, p.y);
      } else {
        context.lineTo(p.x, p.y);
      }
    }
    context.stroke();
  }
};

class AverageLine {
  constructor(context) {
    this.context = context;
    this.painter = Painter;
    this.color = '';
    this.points = [];
  }

  update({ points, color }) {
    this.points = points;
    this.color = color;
  }

  paint() {
    this.painter.paint(this, this.context);
  }
}

export default AverageLine;
