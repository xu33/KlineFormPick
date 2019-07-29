// import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Zoom from 'd3-zoom';
import * as d3Array from 'd3-array';
import Hammer from 'hammerjs';
import { highDPIConvert } from './utils';
// import RangeSelector from './RangeSelecter';
import RangeSelectorDOM from './RangeSelectorDOM';
import CandleStick, { CandleStickPainter } from './CandleStick';

const RED = '#F54646';
const GREEN = '#27B666';
const EQUAL = '#999999';
const GRID_COLOR = '#eee';
const BLUE = '#07d';

const d3 = Object.assign({}, d3Scale, d3Zoom, d3Array);

const KlineChart = (element, options) => {
  let MARGIN = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 16
  };

  let { data } = options;
  let { width, height } = element.getBoundingClientRect();

  let canvas = document.createElement('canvas');
  let context = highDPIConvert(canvas, width, height);

  let cs = new CandleStick(CandleStickPainter, context);
  let TOTAL = data.length;
  const MIN_COUNT = 61;
  const MAX_COUNT = 100;

  let MAX_SCALE = TOTAL / MIN_COUNT;
  let MIN_SCALE = TOTAL / MAX_COUNT;
  let k = MAX_SCALE;

  if (k < 1) {
    k = 1;
  }

  let tx = -width * k + width;
  let transform = d3.zoomIdentity.translate(tx, 0).scale(k);

  let indexScale = d3
    .scaleLinear()
    .domain([0, TOTAL - 1])
    .range([0, width]);

  let currentIndexScale = transform.rescaleX(indexScale);
  let [startIndex, endIndex] = currentIndexScale.domain();

  startIndex = parseInt(startIndex);

  const mainBound = {
    top: 0,
    left: 0,
    width: width,
    height: height - MARGIN.bottom
  };

  let priceHeightScale = d3.scaleLinear().range([mainBound.height, 0]);

  const computePriceHeightScale = () => {
    let part = data.slice(startIndex, endIndex + 1);
    let min = Math.min(
      ...part.map(v => {
        return Math.min(v.fClose, v.fLow, v.fOpen, v.fHigh);
      })
    );

    let max = Math.max(
      ...part.map(v => {
        return Math.max(v.fClose, v.fLow, v.fOpen, v.fHigh);
      })
    );

    priceHeightScale.domain([min, max]);
  };

  // 价格轴
  const renderLeftAxis = () => {
    let priceDomain = priceHeightScale.domain();
    // for (let i = 0; i < priceDomain.length; i++) {
    //   let x = 0;
    //   let y = priceHeightScale.range()[i];
    //   let text = priceDomain[i].toFixed(2);
    //   if (i == 0) {
    //     context.textBaseline = 'bottom';
    //   } else if (i == 1) {
    //     context.textBaseline = 'top';
    //   }
    //   context.textAlign = 'left';
    //   context.font = '12px Arial';
    //   context.fillText(text, x, y);
    // }

    // let quant = d3.quantile(priceDomain);
    console.log(priceDomain);
    const TICK_COUNT = 4;
    context.font = '12px Arial';
    for (let i = 0; i <= TICK_COUNT; i++) {
      let x1 = 0;
      let val = d3.quantile(priceDomain, i / 4);
      let y1 = parseInt(priceHeightScale(val)) + 0.5;
      let y2 = y1;
      let x2 = width;

      context.strokeStyle = '#E7E7E7';
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();

      if (i == TICK_COUNT) {
        context.textBaseline = 'top';
      } else {
        context.textBaseline = 'bottom';
      }

      context.fillText(val.toFixed(2), x1, y1);
    }
  };

  // 时间轴
  const renderBottomAxis = () => {
    let a = data[startIndex];
    let b = data[endIndex];

    let w = context.measureText(b.iDate).width;
    context.save();
    context.font = '12px Arial';
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.translate(0, height - MARGIN.bottom + 2);
    context.fillStyle = 'rgba(17,17,17,0.60)';
    context.fillText(a.iDate, 0, 0);
    context.fillText(b.iDate, width - w, 0);
    context.restore();
  };

  const scale = d3
    .scaleBand()
    .range([0, mainBound.width])
    .paddingInner(0.12);
  // .paddingOuter(1);

  const renderSticks = () => {
    // console.log('render fired');
    context.clearRect(0, 0, width, height);

    // 根据数据范围新计算比例尺
    computePriceHeightScale();
    // 辅助线
    // renderHozGrids(mainBound.width, mainBound.height);
    // renderVerGrids(mainBound.width, mainBound.height);
    // 价格轴
    renderLeftAxis();
    // 时间轴
    renderBottomAxis();
    console.log('endIndex + 1:', endIndex + 1);
    let part = data.slice(startIndex, endIndex + 1);

    scale.domain(part.map((value, index) => index));

    let rectWidth = parseInt(scale.bandwidth());
    for (let i = 0; i < part.length; i++) {
      context.save();
      let { fOpen, fClose, fLow, fHigh } = part[i];
      let color;

      if (fOpen > fClose) {
        color = GREEN;
      } else {
        color = RED;
      }

      cs.update({
        x: x,
        y: y,
        width: width,
        height: height
      });

      context.fillStyle = color;
      context.strokeStyle = color;

      let x = parseInt(scale(i));
      let y1 = priceHeightScale(fHigh);
      let y2 = priceHeightScale(fLow);

      // 蜡烛
      let y = priceHeightScale(Math.max(fOpen, fClose));
      let width = rectWidth;
      let height = Math.abs(priceHeightScale(fOpen) - priceHeightScale(fClose));

      cs.update({
        x: x,
        y: y,
        yHigh: y1,
        yLow: y2,
        width: width,
        height: height,
        color: color
      });

      cs.paint();

      // drawRect(x, y, width, height, fill);

      context.restore();
    }
  };

  const initZoomHammer = () => {
    let mc = new Hammer.Manager(element, {});
    mc.add(
      new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 2 })
    );
    mc.add(new Hammer.Pinch({ threshold: 0, pointers: 0 }));

    // mc.get('pinch').set({ enable: true });

    let prevTransform = transform;

    mc.on('panstart', function(ev) {
      if (mc.disable) {
        return;
      }
      prevTransform = transform;
    });

    mc.on('pan', function(ev) {
      if (mc.disable) {
        return;
      }

      let tx = (ev.deltaX / transform.k).toFixed(2);
      let ty = 0;

      transform = prevTransform.translate(tx, ty);

      if (transform.x > 0) {
        transform.x = 0;
      }

      if (transform.x < -(width * transform.k - width)) {
        transform.x = -(width * transform.k - width);
      }

      currentIndexScale = transform.rescaleX(indexScale);
      let domain = currentIndexScale.domain();
      let start = Math.round(domain[0]);
      let end = Math.round(domain[1]);

      if (start < 0) start = 0;
      if (end > data.length) end = data.length;

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();
        onRangeChange();
      }
    });

    /*
    let lastScale = 1;
    let h1 = document.getElementById('tit');
    
    mc.on('pinchstart', function(e) {
      mc.get('pan').set({ enable: false });
      lastScale = 1;
    });

    mc.on('pinchstart', function(e) {
      h1.innerHTML = 'pinchstart';
    });

    mc.on('pinch', function(e) {
      let loc = windowToCanvas(canvas, e.center.x, e.center.y);
      let eScale = e.scale > lastScale ? 1.01 : 1 / 1.01;
      let plusScale = eScale - 1;

      let nextScale = transform.k * eScale;

      if (nextScale > MAX_SCALE) {
        nextScale = MAX_SCALE;
      } else if (nextScale < MIN_SCALE) {
        nextScale = MIN_SCALE;
      } else {
        let tx = (loc.x - transform.x) * plusScale;
        transform.x += -tx;
      }

      // h1.innerHTML = nextScale;

      transform.k = nextScale;

      let currentIndexScale = transform.rescaleX(indexScale);
      let domain = currentIndexScale.domain();
      let start = parseInt(domain[0]);
      let end = parseInt(domain[1]);

      if (start < 0) {
        end += 0 - start;
        start = 0;
      }

      if (end > data.length - 1) {
        start += end - data.length + 1;
        end = data.length - 1;
      }

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();
      }

      // prevTransform = transform;

      lastScale = e.scale;
    });

    mc.on('pinchend', function(e) {
      h1.innerHTML = 'pinchend';
      setTimeout(function() {
        mc.get('pan').set({ enable: true });
      }, 100);
    });

    // 测试用
    let mouse = {};
    let zoom = inout => {
      let loc = windowToCanvas(canvas, mouse.x, mouse.y);
      let eScale = inout ? 1.05 : 1 / 1.05;
      let plusScale = eScale - 1;

      let nextScale = transform.k * eScale;
      if (nextScale > MAX_SCALE) {
        nextScale = MAX_SCALE;
      } else if (nextScale < MIN_SCALE) {
        nextScale = MIN_SCALE;
      } else {
        let tx = (loc.x - transform.x) * plusScale;
        transform.x += -tx;
      }

      transform.k = nextScale;

      // console.log(transform);

      let currentIndexScale = transform.rescaleX(indexScale);
      let domain = currentIndexScale.domain();
      let start = parseInt(domain[0]);
      let end = parseInt(domain[1]);

      // console.log(start, end);

      if (start < 0) {
        end += 0 - start;
        start = 0;
      }

      if (end > data.length - 1) {
        start += end - data.length + 1;
        end = data.length - 1;
      }

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();
      }
    };

    // 测试用
    document.addEventListener('keypress', function(e) {
      let keyCode = e.keyCode;
      if (keyCode == 119) {
        zoom(true);
      } else if (keyCode == 115) {
        zoom(false);
      }
    });

    // 测试用
    document.addEventListener('touchstart', function(e) {
      mouse.x = e.touches[0].pageX;
      mouse.y = e.touches[0].pageY;
    });
    */

    return mc;
  };

  var range = [];

  function onRangeChange() {
    var start = Math.round(currentIndexScale.invert(range[0]));
    var end = Math.round(currentIndexScale.invert(range[1]));

    options.onRangeChange(start, end);
  }

  return {
    getRange() {
      return range;
    },
    getStep() {
      return scale.step();
    },
    render() {
      element.appendChild(canvas);

      // 绘制
      renderSticks();

      // 绑定缩放事件
      let mc = initZoomHammer();

      let rs = new RangeSelectorDOM({
        container: element,
        width: width,
        height: height,
        margin: MARGIN,
        scale: scale,
        onReady: function(t, range) {
          // $('.rangedisplay').css({
          //   left: range[0],
          //   width: range[1] - range[0]
          // });
          // $('.rangedisplay .txt').html(`${count}周期`);
          // options.onRangeInit(count);
        },
        onSelect: function() {
          mc.disable = true;
        },
        onChange: function(t, newRange) {
          // $('.rangedisplay').css({
          //   left: range[0],
          //   width: range[1] - range[0]
          // });

          // $('.rangedisplay .txt').html(`${count}周期`);

          // console.log(range);
          range = newRange;
          // let step = scale.step();
          // options.onRangeChange(range, step);
          // console.log(
          //   'range:',
          //   currentIndexScale.invert(range[0]),
          //   currentIndexScale.invert(range[1])
          // );

          onRangeChange();
        },
        onSelectEnd: function() {
          setTimeout(() => (mc.disable = false), 100);
        }
      });
      // rs.render();
    },
    destroy: () => {
      d3.select(element).on('.zoom', null);
      element.removeChild(canvas);
    }
  };
};

export default KlineChart;
