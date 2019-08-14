var d3 = require('d3');
var transform = d3.zoomIdentity;
var scale = d3
  .scaleLinear()
  .range([0, 300])
  .domain([0, 1000]);

var k = 1000 / 60;
// transform = transform.translate(-300 * k + 300, 0).scale(k);
transform = transform.translate(0, 0).scale(k);
console.log(transform);
var ns = transform.rescaleX(scale);
console.log(ns.domain());

setTimeout(function() {
  scale.domain([0, 1500]);
  let k = 1500 / 60;
  transform.k = k;
  let x = scale(500);
  transform.x = transform.x - x * k;
  console.log(transform);
  let ns = transform.rescaleX(scale);
  console.log(ns.domain());
}, 1000);

// var scale = d3
//   .scaleLinear()
//   .range([0, 386])
//   .domain([440, 500]);
// console.log(scale.invert(386));
