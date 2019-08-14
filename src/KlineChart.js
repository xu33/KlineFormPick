// import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Zoom from 'd3-zoom';
import * as d3Array from 'd3-array';
import Hammer from 'hammerjs';
import { highDPIConvert, windowToCanvas } from './utils';
// import RangeSelector from './RangeSelecter';
import RangeSelectorDOM from './RangeSelectorDOM';
import CandleStick from './CandleStick';
import AverageLine from './AverageLine';

const d3 = Object.assign({}, d3Scale, d3Zoom, d3Array);

const RED = '#F54646';
const GREEN = '#27B666';
const EQUAL = '#999999';
const GRID_COLOR = '#eee';
const BLUE = '#07d';

function KlineChart(element, options) {
  let MARGIN = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 16
  };

  let { data } = options;

  let { width, height } = element.getBoundingClientRect();

  let mainBound = {
    top: 0,
    left: 0,
    width: width,
    height: height - MARGIN.bottom
  };

  let canvas = document.createElement('canvas');
  let context = highDPIConvert(canvas, width, height);

  // flyweight pattern
  let cs = new CandleStick(context);
  let al = new AverageLine(context);

  let TOTAL = data.length;
  let MIN_COUNT = 60; //Math.min(60, TOTAL);
  let MAX_COUNT = Math.min(120, TOTAL);

  let MAX_SCALE = TOTAL / MIN_COUNT;
  let MIN_SCALE = TOTAL / MAX_COUNT;

  let k = MAX_SCALE;

  if (k < 1) {
    k = 1;
  }

  let tx = -width * k + width;
  let transform = d3.zoomIdentity.translate(tx, 0).scale(k);

  // K线数量不足一屏时
  let PERCENT = TOTAL > MIN_COUNT ? 1 : TOTAL / MIN_COUNT;
  let actualWidth = mainBound.width * PERCENT;

  let indexScale = d3
    .scaleLinear()
    .domain([0, TOTAL - 1])
    .range([0, actualWidth]);

  let currentIndexScale = transform.rescaleX(indexScale);
  let [startIndex, endIndex] = currentIndexScale.domain();

  startIndex = endIndex - MIN_COUNT + 1;

  if (startIndex < 0) {
    startIndex = 0;
  }

  let priceHeightScale = d3.scaleLinear().range([mainBound.height, 0]);

  function computePriceHeightScale() {
    let part = data.slice(startIndex, endIndex + 1);
    let min = Math.min(
      ...part.map(v => {
        return d3.min([v.fLow, v.ma5, v.ma10, v.ma20, v.ma30]);
      })
    );

    let max = Math.max(
      ...part.map(v => {
        return d3.max([v.fHigh, v.ma5, v.ma10, v.ma20, v.ma30]);
      })
    );

    priceHeightScale.domain([min, max]);
  }

  // 价格轴
  function renderLeftAxis() {
    let priceDomain = priceHeightScale.domain();
    let range = priceHeightScale.range();
    const TICK_COUNT = 4;
    context.save();
    context.font = '12px Arial';
    // 辅助线颜色
    context.strokeStyle = '#E7E7E7';

    for (let i = 0; i <= TICK_COUNT; i++) {
      let x1 = 0;
      let y1 = d3.quantile(range, i / 4) + 0.5; //parseInt(priceHeightScale(val)) + 0.5;
      let y2 = y1;
      let x2 = width;

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

      let val = d3.quantile(priceDomain, i / 4);
      // 字体颜色
      context.fillStyle = '#333333';
      context.fillText(val.toFixed(2), x1, y1);
    }

    context.restore();
  }

  // 时间轴
  function renderBottomAxis() {
    let a = data[startIndex];
    let b = data[endIndex];
    let PADDING = 2;

    context.save();
    context.font = '12px Arial';
    context.textBaseline = 'top';

    context.translate(0, height - MARGIN.bottom + PADDING);
    context.fillStyle = 'rgba(17,17,17,0.60)';
    context.textAlign = 'start';
    context.fillText(a.iDate, 0, 0);
    context.textAlign = 'end';
    context.fillText(b.iDate, width, 0);
    context.restore();
  }

  const scale = d3
    .scaleBand()
    .range([0, actualWidth])
    .paddingInner(0.12);
  // .paddingOuter(1);

  let currentPart = null;
  function renderSticks() {
    // console.log('render fired');
    context.clearRect(0, 0, width, height);

    // 根据数据范围新计算比例尺
    computePriceHeightScale();
    // 价格轴
    renderLeftAxis();
    // 时间轴
    renderBottomAxis();

    let part = data.slice(startIndex, endIndex + 1);
    currentPart = part;

    // 设置bandscale的定义域
    scale.domain(part.map((value, index) => index));
    let rectWidth = parseInt(scale.bandwidth());

    // 绘制蜡烛线
    for (let i = 0; i < part.length; i++) {
      context.save();
      let { fOpen, fClose, fLow, fHigh } = part[i];
      let color;

      if (fOpen > fClose) {
        color = GREEN;
      } else {
        color = RED;
      }

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

      context.restore();
    }

    // 绘制均线
    let keys = ['ma5', 'ma10', 'ma20', 'ma30'];
    let colors = ['#29D8FF', '#3691E1', '#E051B6', '#EF7F21'];
    keys.forEach((k, i) => {
      let points = part
        .map((o, i) => {
          return {
            x: scale(i),
            y: k in o ? priceHeightScale(o[k]) : null
          };
        })
        .filter(o => {
          return Boolean(o.y);
        });

      al.update({ points: points, color: colors[i] });
      al.paint();
    });
  }

  let selectedRange = [];

  let mc = null; // 手势实例
  let rs = null; // 选择器实例

  function initZoomHammer() {
    mc = new Hammer.Manager(element, {});
    const panRecognizer = new Hammer.Pan({
      direction: Hammer.DIRECTION_HORIZONTAL,
      threshold: 2
    });
    const pinchRecognizer = new Hammer.Pinch({
      threshold: 0,
      pointers: 0
    });
    mc.add([panRecognizer, pinchRecognizer]);

    /**** 拖动逻辑 ****/
    let prevTransform = transform;
    function handlePanStart(ev) {
      if (mc.disable) {
        return;
      }
      prevTransform = transform;
    }

    function handlePan(ev) {
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
      let between = Math.ceil(domain[1] - domain[0]);
      let end = Math.ceil(domain[1]);
      let start = end - between + 1;

      if (start < 0) start = 0;
      if (end > TOTAL) end = TOTAL;

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();
        onRangeChange();
      }
    }

    mc.on('panstart', handlePanStart);
    mc.on('pan', handlePan);
    /**** 拖动逻辑 ****/

    /************************* 双指缩放逻辑开始 **************************/
    let lastScale = 1;

    function handlePinchStart(e) {
      mc.get('pan').set({ enable: false });
      lastScale = 1;
    }

    function handlePinch(e) {
      let deltaX = windowToCanvas(canvas, e.center.x, e.center.y).x;

      let eScale = e.scale > lastScale ? 1.01 : 1 / 1.01;
      let plusScale = eScale - 1;
      let nextScale = transform.k * eScale;
      // console.log('nextScale:', nextScale);

      if (nextScale > MAX_SCALE) {
        nextScale = MAX_SCALE;
      } else if (nextScale < MIN_SCALE) {
        nextScale = MIN_SCALE;
      } else {
        let tx = (deltaX - transform.x) * plusScale;
        transform.x += -tx;
      }

      transform.k = nextScale;
      currentIndexScale = transform.rescaleX(indexScale);
      let domain = currentIndexScale.domain();

      let start = parseInt(domain[0]);
      let end = parseInt(domain[1]);
      let between = end - start + 1;

      if (start < 0) {
        start = 0;
        end = start + between - 1;
      }

      if (end >= TOTAL) {
        end = TOTAL - 1;
        start = end - between + 1;
      }

      if (startIndex != start || endIndex != end) {
        startIndex = start;
        endIndex = end;
        renderSticks();

        // 更新选择框
        resetRangeAfterZoom();
      }

      lastScale = e.scale;
    }

    function __handlePinch(e) {
      let deltaX = windowToCanvas(canvas, e.center.x, e.center.y).x;
      let eScale = e.scale > lastScale ? 1.01 : 1 / 1.01;

      let plusScale = eScale - 1;

      let nextScale = transform.k * eScale;

      if (nextScale > MAX_SCALE) {
        nextScale = MAX_SCALE;
      } else if (nextScale < MIN_SCALE) {
        nextScale = MIN_SCALE;
      } else {
        let tx = (deltaX - transform.x) * plusScale;
        transform.x += -tx;
      }

      transform.k = nextScale;

      currentIndexScale = transform.rescaleX(indexScale);
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
        // onRangeChange();
      }

      lastScale = e.scale;
    }

    function handlePinchEnd(e) {
      setTimeout(function() {
        mc.get('pan').set({ enable: true });
      }, 100);
    }

    mc.on('pinchstart', handlePinchStart);
    mc.on('pinch', handlePinch);
    mc.on('pinchend', handlePinchEnd);

    /************************* 双指缩放逻辑结束 **************************/

    return mc;
  }

  let rangeStartIndex = 0;
  let rangeEndIndex = 0;

  function onRangeChange() {
    // console.log(selectedRange);
    let between = Math.round(
      (selectedRange[1] - selectedRange[0]) / scale.step()
    );
    // console.log('between:', between);
    // let end = Math.ceil(currentIndexScale.invert(selectedRange[1]));
    // end = Math.min(end, TOTAL - 1);
    // let start = end - between + 1;

    // rangeStartIndex = start;
    // rangeEndIndex = end;

    let [x1, x2] = selectedRange;

    let relativeRangeEndIndex = Math.round(x2 / scale.step()) - 1;
    let relativeRangeStartIndex = relativeRangeEndIndex - between + 1;
    // console.log('relativeRangeEndIndex:', relativeRangeEndIndex);

    /*********边界限制 ******************/
    if (relativeRangeStartIndex < 0) {
      relativeRangeStartIndex = 0;
      relativeRangeEndIndex = relativeRangeStartIndex + between - 1;
    }

    if (relativeRangeEndIndex >= currentPart.length) {
      relativeRangeEndIndex = currentPart.length - 1;
      relativeRangeStartIndex = relativeRangeEndIndex - between + 1;
    }
    /*********边界限制 ******************/

    rangeStartIndex = relativeRangeStartIndex + startIndex;
    rangeEndIndex = Math.min(relativeRangeEndIndex + startIndex, TOTAL - 1);

    // console.log('range:', startIndex, endIndex, rangeStartIndex, rangeEndIndex);

    options.onRangeChange(rangeStartIndex, rangeEndIndex);
  }

  // 缩放后处理所选择区域的缩放
  function resetRangeAfterZoom() {
    try {
      let nextRangeStartIndex = rangeStartIndex;
      let nextRangeEndIndex = rangeEndIndex;

      let relativeRangeStartIndex = nextRangeStartIndex - startIndex;
      let relativeRangeEndIndex = nextRangeEndIndex - startIndex;

      let between = relativeRangeEndIndex - relativeRangeStartIndex + 1;

      /*********边界限制 ******************/
      if (relativeRangeStartIndex < 0) {
        relativeRangeStartIndex = 0;
        relativeRangeEndIndex = relativeRangeStartIndex + between - 1;
      }

      if (relativeRangeEndIndex >= currentPart.length) {
        relativeRangeEndIndex = currentPart.length - 1;
        relativeRangeStartIndex = relativeRangeEndIndex - between + 1;
      }
      /*********边界限制 ******************/

      let x1 = Math.max(scale(relativeRangeStartIndex), 0);
      let x2 = Math.min(
        scale(relativeRangeEndIndex) + scale.step(),
        mainBound.width
      );

      selectedRange[0] = x1;
      selectedRange[1] = x2;

      rs.manualUpdate({ x1: selectedRange[0], x2: selectedRange[1] });
      onRangeChange();
    } catch (e) {
      // document.querySelector('.log').innerHTML =
      //   rangeStartIndex + ',' + rangeEndIndex;
    }
  }

  // 测试用
  function zoomTest() {
    let deltaX = 350;
    let eScale = 0.9;

    let plusScale = eScale - 1;

    let nextScale = transform.k * eScale;
    // console.log('nextScale:', nextScale);

    if (nextScale > MAX_SCALE) {
      nextScale = MAX_SCALE;
    } else if (nextScale < MIN_SCALE) {
      nextScale = MIN_SCALE;
    } else {
      let tx = (deltaX - transform.x) * plusScale;
      transform.x += -tx;
    }

    transform.k = nextScale;
    // console.log('nextScale:', transform.k);

    currentIndexScale = transform.rescaleX(indexScale);
    let domain = currentIndexScale.domain();

    let start = parseInt(domain[0]);
    let end = parseInt(domain[1]);
    let between = end - start + 1;

    if (start < 0) {
      start = 0;
      end = start + between - 1;
    }

    if (end >= TOTAL) {
      end = TOTAL - 1;
      start = end - between + 1;
    }

    if (startIndex != start || endIndex != end) {
      startIndex = start;
      endIndex = end;
      renderSticks();

      resetRangeAfterZoom();
    }
  }

  return {
    getRange: function() {
      return selectedRange;
    },
    getStep: function() {
      return scale.step();
    },
    render: function() {
      element.appendChild(canvas);

      // 绘制
      renderSticks();

      if (!options.enablePick) {
        return;
      }

      // 绑定缩放事件
      mc = initZoomHammer();

      // 选择器初始化
      rs = new RangeSelectorDOM({
        container: element,
        width: actualWidth,
        height: height,
        margin: MARGIN,
        scale: scale,
        onSelect: function() {
          mc.disable = true;
        },
        onChange: function(t, newRange) {
          selectedRange = newRange;
          onRangeChange();
        },
        onSelectEnd: function() {
          setTimeout(function() {
            mc.disable = false;
          }, 100);
        }
      });

      this.mc = mc;
      this.rs = rs;

      // setTimeout(function() {
      //   zoomTest();
      //   // setTimeout(function() {
      //   //   zoomTest();
      //   //   // zoomTest();
      //   // }, 3000);
      // }, 3000);
    },
    destroy: function() {
      element.removeChild(canvas);
      if (this.mc) {
        this.mc.destory();
      }
      if (this.rs) {
        this.rs.destroy();
      }
    }
  };
}

export default KlineChart;
