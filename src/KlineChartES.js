// import * as d3Scale from 'd3-scale';
// import * as d3Zoom from 'd3-zoom';
// import * as d3Array from 'd3-array';
// import Hammer from 'hammerjs';
// import { highDPIConvert } from './utils';
// import RangeSelectorDOM from './RangeSelectorDOM';
// import CandleStick from './CandleStick';
// import AverageLine from './AverageLine';

// const d3 = Object.assign({}, d3Scale, d3Zoom, d3Array);
// const RED = '#F54646';
// const GREEN = '#27B666';
// const EQUAL = '#999999';
// const GRID_COLOR = '#eee';
// const BLUE = '#07d';

// const computeMa = (arr, key, num) => {
//   for (var i = num - 1; i < arr.length; i++) {
//     var item = arr[i];
//     var sum = item[key];
//     for (var j = i - (num - 1); j < i; j++) {
//       sum += arr[j][key];
//     }

//     arr[i][`ma` + num] = sum / num;
//   }

//   return arr;
// };

// const MARGIN = {
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 16
// };

// class KlineChart {
//   constructor(element, options) {
//     this.data = options.data;
//     this.options = options;
//     this.canvas = document.createElement(canvas);

//     let { width, height } = element.getBoundingClientRect();
//     this.width = width;
//     this.height = height;
//     this.context = highDPIConvert(canvas, width, height);

//     this.cs = new CandleStick(context);
//     this.al = new AverageLine(context);

//     this.MIN_COUNT = 60;
//     this.MAX_COUNT = 100;
//     this.initTransform();
//   }

//   initTransform() {
//     let total = this.data.length;
//     let MAX_SCALE = total / this.MIN_COUNT;
//     let MIX_SCALE = total / this.MAX_COUNT;
//     let k = this.MAX_SCALE;
//     if (k < 1) {
//       k = 1;
//     }

//     let width = this.width;
//   }
// }

// ElapsedTime = now - then;
// fps = 1000 / ElapsedTime;
// speed = 100;

// moveDistance = speed / fps == speed * ElapsedTime / 1000;

console.log(requestAnimationFrame);
