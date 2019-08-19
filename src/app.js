import KlineChart from './KlineChart';
import data from './data.js';
const a = 1;
const b = x => 3;
b();
let chart = KlineChart(document.getElementById('container'), {
  data: data,
  enablePick: true,
  onRangeChange() {}
});
chart.render();
// var canvas = document.querySelector('canvas');
// var context = canvas.getContext('2d');
// context.rect(10, 10, 12, 10);
// context.stroke();

// context.moveTo(10 + 6.5, 10);
// context.lineTo(10 + 6.5, 30);
// context.stroke();
