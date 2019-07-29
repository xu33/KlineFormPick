var d3 = require('d3');
// var transform = d3.zoomIdentity;
// var scale = d3
//   .scaleLinear()
//   .range([0, 300])
//   .domain([0, 2000]);

// var k = 2000 / 30;
// transform = transform.translate(-300 * k + 300, 0).scale(k);
// console.log(transform);
// var ns = transform.rescaleX(scale);
// console.log(ns.domain());

var scale = d3
  .scaleLinear()
  .range([0, 386])
  .domain([440, 500]);
console.log(scale.invert(386));
