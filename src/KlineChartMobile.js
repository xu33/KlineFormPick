import * as d3Scale from 'd3-scale';
import * as d3Zoom from 'd3-zoom';
import Hammer from 'hammerjs';
import { windowToCanvas, highDPIConvert } from './utils';
import RangeSelector from './RangeSelecter';
import CandleStick, { CandleStickPainter } from './CandleStick';

const RED = '#F54646';
const GREEN = '#27B666';
const d3 = Object.assign({}, d3Scale, d3Zoom);

class KlineChart {
  constructor(element, options) {}
}
