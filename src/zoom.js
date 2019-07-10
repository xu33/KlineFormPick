var d3scale = require('d3-scale');
var zoomIdentity = require('d3-zoom').zoomIdentity;
var scaleLinear = d3scale.scaleLinear;

// var domain = [0, 1000];
// var range = [0, 320];
// var s = scaleLinear()
//   .domain(domain)
//   .range(range);

// var zoom = zoomIdentity.translate(0, 0).scale(10);

// console.log(zoom);

// var news = zoom.rescaleX(s);
// console.log(news.domain(), news.range());

// var w = 320 * 10;
// var unitW = w / 1000;
// var offsetUnitCount = 100 / unitW;

// console.log(offsetUnitCount);

var z1 = zoomIdentity.translate(10, 0).scale(5);
var z2 = z1.translate(2, 0);

// console.log(z1, z2);
// var z2 = z1.scale(2);
// var z3 = z2.translate(5, 0);
console.log(z1, z2);
