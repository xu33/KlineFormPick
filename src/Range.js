var d3 = require('d3');

var scale = d3
  .scaleLinear()
  .domain([0, 100])
  .range([0, 300]);

var Range = {
  setScale(scale) {
    this.scale = scale;
  },
  start: 0,
  end: 0,
  convert(x1, x2) {
    var start = this.scale(x1);
    var end = this.scale(x2);

    return {
      start,
      end
    };
  },
  invertConvert(start, end) {
    return {
      x1: this.scale.invert(start),
      x2: this.scale.invert(end)
    };
  }
};

console.log(scale(95), scale(100));
console.log(scale.invert(282), scale.invert(290));

startIndex = 0;
endIndex = 5;

scaleBand(startIndex) + bandwidth * (endIndex - startIndex);
