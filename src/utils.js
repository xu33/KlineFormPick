function windowToCanvas(canvas, x, y) {
  var bbox = canvas.getBoundingClientRect();
  return {
    x: (x - bbox.left) * (canvas.width / bbox.width),
    y: (y - bbox.top) * (canvas.height / bbox.height)
  };
}

function windowToElement(element, x, y) {
  var bbox = element.getBoundingClientRect();
  return {
    x: x - bbox.left,
    y: y - bbox.top
  };
}

function highDPIConvert(canvas, width, height) {
  let devicePixelRatio = window.devicePixelRatio;
  let scaledWidth = width * devicePixelRatio;
  let scaledHeight = height * devicePixelRatio;
  let context = canvas.getContext('2d');
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  context.scale(devicePixelRatio, devicePixelRatio);
  return context;
}

export { windowToCanvas, windowToElement, highDPIConvert };
