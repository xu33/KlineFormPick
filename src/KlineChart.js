// import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Zoom from 'd3-zoom';
import Hammer from 'hammerjs';
import { windowToCanvas, highDPIConvert } from './utils';
import RangeSelector from './RangeSelecter';

const RED = '#F54646';
const GREEN = '#27B666';
const EQUAL = '#999999';
const GRID_COLOR = '#eee';
const BLUE = '#07d';

const d3 = Object.assign({}, d3Scale, d3Zoom);

const KlineChart = (element, options) => {
  // 在上层阻止d3 zoom内部的事件传递
  // element.addEventListener(
  //   'touchmove',
  //   function(e) {
  //     e.stopPropagation();
  //   },
  //   {
  //     capture: true
  //   }
  // );

  let devicePixelRatio = window.devicePixelRatio;
  let { data } = options;
  let { width, height, left, top } = element.getBoundingClientRect();

  const canvas = document.createElement('canvas');
  const context = highDPIConvert(canvas, width, height);

  let startIndex = 0;
  let endIndex = 30;

  let indexScale = d3
    .scaleLinear()
    .domain([0, data.length])
    .range([0, width]);

  const mainBound = {
    top: 0,
    left: 0,
    width: width,
    height: height
  };

  let priceHeightScale = d3.scaleLinear().range([mainBound.height, 0]);

  const drawRect = (x, y, width, height, fill = true) => {
    x = parseInt(x) + 0.5;
    y = parseInt(y) + 0.5;
    width = parseInt(width);
    height = parseInt(height);

    // console.log(x, y, width, height);

    // if (width <= 3) {
    //   return;
    // }

    context.rect(x, y, width, height);
    context.fill();
    context.stroke();
  };

  const drawLine = (x1, y1, x2, y2) => {
    x1 = parseInt(x1) + 0.5;
    y1 = parseInt(y1) + 0.5;
    x2 = parseInt(x2) + 0.5;
    y2 = parseInt(y2) + 0.5;

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);

    context.stroke();
    context.closePath();
  };

  const computePriceHeightScale = () => {
    let part = data.slice(startIndex, endIndex);
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
    for (let i = 0; i < priceDomain.length; i++) {
      let x = 0;
      let y = priceHeightScale.range()[i];
      let text = priceDomain[i].toFixed(2);
      if (i == 0) {
        context.textBaseline = 'bottom';
      } else if (i == 1) {
        context.textBaseline = 'top';
      }
      context.textAlign = 'left';
      context.fillText(text, x, y);
    }
  };

  const scale = d3
    .scaleBand()
    .range([0, mainBound.width])
    .paddingInner(0.4)
    .paddingOuter(0);

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

    let part = data.slice(startIndex, endIndex);

    scale.domain(part.map((value, index) => index));

    const rectWidth = parseInt(scale.bandwidth());
    for (let i = 0; i < part.length; i++) {
      context.save();
      let { fOpen, fClose, fLow, fHigh } = part[i];
      let color, fill;

      if (fOpen > fClose) {
        color = GREEN;
        fill = true;
      } else {
        color = RED;
        fill = false;
      }

      context.fillStyle = color;
      context.strokeStyle = color;

      let x = parseInt(scale(i));
      let x1 = x + rectWidth / 2;
      let x2 = x1;

      let y1 = priceHeightScale(fHigh);
      let y2 = priceHeightScale(fLow);

      drawLine(x1, y1, x2, y2);

      // 蜡烛
      let y = priceHeightScale(Math.max(fOpen, fClose));
      let width = rectWidth;
      let height = Math.abs(priceHeightScale(fOpen) - priceHeightScale(fClose));

      drawRect(x, y, width, height, fill);

      context.restore();
    }
  };

  const initZoomHammer = () => {
    let mc = new Hammer.Manager(element, {});
    mc.add(
      new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 2 })
    );
    mc.add(new Hammer.Pinch({ threshold: 0, pointers: 0 }));

    mc.get('pinch').set({ enable: true });

    let MAX_SCALE = data.length / 20;
    let MIN_SCALE = data.length / 90;
    let k = data.length / (endIndex - startIndex);

    if (k < 1) {
      k = 1;
    }

    let tx = 0;
    let ty = 0;
    let transform = d3.zoomIdentity.scale(k).translate(tx, ty);

    let prevTransform = transform;

    mc.on('panstart', function(ev) {
      prevTransform = transform;
    });

    mc.on('pan', function(ev) {
      let tx = (ev.deltaX / transform.k).toFixed(2);
      let ty = 0;

      transform = prevTransform.translate(tx, ty);

      if (transform.x > 0) {
        transform.x = 0;
      }

      if (transform.x < -(width * transform.k - width)) {
        transform.x = -(width * transform.k - width);
      }

      let currentIndexScale = transform.rescaleX(indexScale);
      let domain = currentIndexScale.domain();
      let start = Math.round(domain[0]);
      let end = Math.round(domain[1]);

      if (start < 0) start = 0;
      if (end > data.length - 1) end = data.length - 1;

      // if (end - start > 40) {
      //   console.log(start, end, domain);
      // }

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();
      }
    });

    let lastScale = 1;
    mc.on('pinchstart', function(e) {
      lastScale = 1;
    });

    let h1 = document.getElementById('tit');

    mc.on('pinch', function(e) {
      let loc = windowToCanvas(canvas, e.center.x, e.center.y);
      h1.innerHTML = e.scale;
      let eScale = e.scale > lastScale ? 1.05 : 1 / 1.05;
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

      let currentIndexScale = transform.rescaleX(indexScale);
      let domain = currentIndexScale.domain();
      let start = parseInt(domain[0]);
      let end = parseInt(domain[1]);

      if (start < 0) start = 0;
      if (end > data.length - 1) end = data.length - 1;

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();
      }

      // prevTransform = transform;

      lastScale = e.scale;
    });

    mc.on('pinchend', function(e) {
      h1.innerHTML = transform;
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

    return mc;
  };

  return {
    render() {
      element.appendChild(canvas);

      // 绘制
      renderSticks();

      // 绑定缩放事件
      let mc = initZoomHammer();

      let rs = new RangeSelector({
        container: element,
        width: width,
        height: height,
        scale: scale,
        onSelect: function() {
          mc.stop();
        }
      });
      rs.render();
    },
    destroy: () => {
      d3.select(element).on('.zoom', null);
      element.removeChild(canvas);
    }
  };
};

export default KlineChart;
