// 01000101 01010110 00110011

let seed
let seedChannels = [];
let seedChannelIndex = 0;
let p5canvas;
let fxShader, feedbackShader;
let currentBuffer, previousBuffer, fxBuffer, bgBuffer, petalBuffer;
let textBuffer;
let FR = 24;
let timeCounter = 0;
let aspectRatio;
let mX = 0;
let mY = 0;
let cnv;

let p0, p1, p2, p3;
let font;
let minDim;
let lineWidth;

let rMult, gMult, bMult;
let chunk = 1;
let useReverse = false;

let useGradientScrim = false;
let skrimMix = 1.;
let stMod = 1.;
let staticMod = 0.;

let focalObjects = []
let mainBoxes = [];
let initBoxCoords = {};
let canvasStrokeW
let pSortAlgo = 0.;
let glitchingTimeId = false;
let useCurveVertex = false;
let inputInt = 0
let activator = 0.5;
let ranStMult = 1;
let useRanBorder = false;
let useFlipH = false;
let useFlipV = false;
let wasReverse = false;
let resetting = false;
let usePortrait = false;
let useGrayScale = false;
let useClear = false;
let useFeedback = true;

let canvWidth, canvHeight;
let startWidth, startHeight;
let widthModMult, heightModMult;

let button


let rotateId = 0

let getColorTry = 0;


const initWidth = 1024;
const initHeight = 768;

let previewCaptured = false;



function evenBucket(n) {
  return Math.floor(n / 2) * 2;
}
function scaleToFraction(x) {
  let numberOfDigits = Math.floor(Math.log10(x)) + 1;
  let scale = Math.pow(10, numberOfDigits - 1);
  return x / scale;
}
const mapFxRand = (start, end) => {
  // Map the fx hash random number to a range between start and end
  return start + $fx.rand() * (end - start);
};


//TODO: delete this
function preload() {
  try {
    // font = loadFont("VT323-REgular.ttf");
    button = document.getElementById("fxhash-button");
    const handleNewHash = () => {
      const url = new URL(window.location.href);
      const newHash =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      url.searchParams.set("fxhash", newHash);

      //reload the page with the new hash
      window.location.href = url.toString();
    };
    button.addEventListener("click", handleNewHash);
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleNewHash();
    });
  } catch (error) {
    alert(`Error: ${error.message}`)
    console.error(error)
  }
}

let initCoords

async function setup() {  
  timeCounter = 0;
  $fx.rand.reset();

  const isPreview = $fx.isPreview;


  if (!isPreview) { 
    //responsive canvas
    const s = getDynamicSize();
    canvWidth = s.w;
    canvHeight = s.h;
  } else {
    canvWidth = initWidth;
    canvHeight = initHeight;
  }

  initCoords = {
    w: canvWidth,
    h: canvHeight,
  }

  // createCanvas(windowWidth, windowHeight);
  p5canvas = createCanvas(canvWidth, canvHeight);
  pixelDensity(1);
  frameRate(FR);

  useFlipH = false;
  useFlipV = false;

  if (useFeedback) {
    const widthMin = usePortrait ? 0.8 : 0.66;
    const heightMin = usePortrait ? 0.66 : 0.8;

    widthModMult = mapFxRand(widthMin, 1.0);
    heightModMult = mapFxRand(heightMin, 1.0);

    canvWidth *= widthModMult;
    canvHeight *= heightModMult;

    useFlipH = $fx.rand() < 0.5;
    useFlipV = $fx.rand() < 0.5;
  } else {
    //useSame number of randoms
    let placeholder = $fx.rand();
    placeholder = $fx.rand();
    placeholder = $fx.rand();
    placeholder = $fx.rand();
  }
  

  fxBuffer = createGraphics(canvWidth, canvHeight, WEBGL);
  petalBuffer = createGraphics(canvWidth, canvHeight);
  currentBuffer = createGraphics(canvWidth, canvHeight, WEBGL);
  previousBuffer = createGraphics(canvWidth, canvHeight, WEBGL);

  fxShader = fxBuffer.createShader(vertex, fxFrag);
  feedbackShader = previousBuffer.createShader(vertex, feedbackFrag);

  fxBuffer.shader(fxShader);
  previousBuffer.shader(feedbackShader);




  currentBuffer.noStroke();
  previousBuffer.noStroke();
  fxBuffer.noStroke();
  petalBuffer.noStroke();

  initialize();

}

function initialize(keepGlitch = false) {
  if (!resetting) {
    if (!seed) {
      //init with fx hash ran number
      seed = $fx.rand() * 1000;
      seedChannels = [seed, seed + 111, seed + 222];
    } else {
      // use date and random after first run
      seed = seedChannels[seedChannelIndex];
    }
  }

  randomSeed(seed);
  noiseSeed(seed);

  if (width > height) {
    aspectRatio = [width / height, 1];
  } else {
    aspectRatio = [1, height / width];
  }

  getColorTry = 0;
  getColorMults();

  //get interger between 0 and 5
  inputInt = floor(random(0, 6));
  activator = random();

  chunk = random([1, 2, 2, 2, 4, 4, 4, 8]);
  useReverse = random() < 0.1;
  skrimMix = random([0, 0.25, 0.5, 0.5, 0.5, 0.75]);

  useGradientScrim = useReverse || random([true, false]);

  stMod = random(0.5, 1.8);

  staticMod = 0.15;
  const staticChance = random();
  if (staticChance < 0.08) {
    staticMod = random([0, 0.5]);
  } else if (staticChance < 0.28) {
    staticMod = random([0.1, 0.3]);
  } else {
    staticMod = 0.2;
  }

  pSortAlgo = random();
  useCurveVertex = random([true, false]);

  useGrayScale = random() < 0.04;

  minDim = min(width, height);
  canvasStrokeW = minDim * 0.03;

  ranStMult = random([
    random(0.01, 0.1), //very low
    random(0.1, 0.5), //low
    random(0.5, 1.5), //medium
    random(1.5, 3), //high
    random(3, 5), //very high
  ]);

  initBoxCoords = getInitBoxCoords();

  setUpFlower({ index: 0, ...initBoxCoords, focal: Flower });

  setUpBox({ index: 0, ...initBoxCoords });

  if (useClear) useReverse = false;

  if (!keepGlitch && glitchingTimeId) {
    clearInterval(glitchingTimeId);
    glitchingTimeId = false;
    useClear = false;
  }

  const attributes = {
    ...getColorAttributes(),
    ...getPixelAttribute(),
    ...getStaticAttribute(),
    ...getIntensity(),
    ...getDistortion(),
    faded: useGrayScale,
    reverse: useReverse,
  };
  console.log(attributes);

  $fx.features(attributes);

  //TODO: delete this
  // textBuffer = createGraphics(width, height);
  // textBuffer.textFont("monospace");
  // textBuffer.textFont(font);

  // textBuffer.noStroke();

  // textBuffer.drawingContext.shadowOffsetX = 0;
  // textBuffer.drawingContext.shadowOffsetY = 0;
  // textBuffer.drawingContext.shadowBlur = 40;
  // textBuffer.drawingContext.shadowColor = "black";
}


//TODO: delete this
// function drawText() {
//   textBuffer.clear();
//   textBuffer.push();
//   const xScaleT = useFlipH ? -1 : 1;
//   const yScaleT = useFlipV ? -1 : 1;
//   const xPosT = useFlipH ? width : 0;
//   const yPosT = useFlipV ? height : 0;
//   textBuffer.translate(xPosT, yPosT); // Center the canvas
//   textBuffer.scale(xScaleT, yScaleT); // Flip
//   textBuffer.translate(width / 2, height / 2);

//   const textBase = canvasStrokeW * 1.5;

//   const mainT = () => {
//     textBuffer.textAlign(CENTER, CENTER);
//     textBuffer.textSize(textBase * 4);
//     textBuffer.text("remember.exe", 0, -canvasStrokeW * 4);
//   };

//   const loadingT = () => {
//     textBuffer.textAlign(LEFT, CENTER);
//     textBuffer.textSize(textBase * 1.5);
//     const dots = Array.from(
//       { length: floor(timeCounter * FR * 0.1) % 4 },
//       (_, i) => "."
//     ).join("");
//     textBuffer.text("loading" + dots, -canvasStrokeW * 4, canvasStrokeW);
//   };

//   const minT = () => {
//     textBuffer.textAlign(CENTER, CENTER);
//     textBuffer.textSize(textBase * 1.5);
//     textBuffer.text("est. time - 5 days", 0, canvasStrokeW * 4);
//   };

//   textBuffer.fill(255);
//   mainT();
//   loadingT();
//   minT();

//   textBuffer.pop();
// }

function getColorAttributes() { 
  let red = "error"
  let green = "error"
  let blue = "error"
 
  if (rMult < 1 / 3) {
    red = "low";
  } else if (rMult < 2 / 3) {
    red = "medium";
  } else {
    red = "high";
  }

  if (gMult < 1 / 3) {
    green = "low";
  } else if (gMult < 2 / 3) {
    green = "medium";
  } else {
    green = "high";
  }

  if (bMult < 1 / 3) {
    blue = "low";
  } else if (bMult < 2 / 3) {
    blue = "medium";
  } else {
    blue = "high";
  }

  return {
    rgb: `${red}-${green}-${blue}`,
  }
}

function getPixelAttribute() {
  let pixelation = "error"

  switch (chunk) {
    case 1:
      pixelation = "none"
      break;
    case 2:
      pixelation = "low"
      break;
    case 4:
      pixelation = "medium"
      break;
    case 8:
      pixelation = "high"
      break;
    default:
      pixelation = "error";
  }

  return {
    pixelation,
  }
}

function getStaticAttribute() { 
  let static = "error"
  switch (staticMod) { 
    case 0:
      static = "none"
      break;
    case 0.1:
      static = "low"
      break;
    case 0.2:
      static = "medium"
      break;
    case 0.3:
      static = "high"
      break;
    case 0.5:
      static = "max"
      break;
  }

  return {
    static
  }
}

function getIntensity() {
  let intensity = "error";
  if(ranStMult < 0.1) {
    intensity = "very-low";
  } else if (ranStMult < 0.5) {
    intensity = "low";
  } else if (ranStMult < 1.5) {
    intensity = "medium";
  } else if (ranStMult < 3) {
    intensity = "high";
  } else if (ranStMult <= 5) { 
    intensity = "very-high";
  }
  return {intensity};
}

function getDistortion() {
  const totalFeedbackMod = widthModMult + heightModMult;
  //(0.66+0.8) = 1.46 to (1+1) //lower is further from center

  let distortion = "error";
  if (totalFeedbackMod < 1.64) {
    distortion = "high";
  } else if (totalFeedbackMod < 1.9) {
    distortion = "medium";
  } else if (totalFeedbackMod <= 2) {
    distortion = "low";
  }

  return {
    distortion
  }
}

function getInitBoxCoords() {
  let windowMargin = minDim * 0.1;

  
  if (useFeedback) {
    windowMargin *= 1 + random(0, 2);
  }
  // Define the aspect ratio for the box (width / height)
  let ratio = 3 / 4;
  
  if (usePortrait) {
    ratio = 4 / 3; // Swap for portrait mode
  }

  const availWidth = width - windowMargin * 2;
  const availHeight = height - windowMargin * 2;



  let boxWidth, boxHeight;
  // Decide whether width or height limits the box size based on available space
  if (availWidth / availHeight < ratio) {
    // Width is the limiting dimension
    boxWidth = availWidth;
    boxHeight = boxWidth / ratio;
  } else {
    // Height is the limiting dimension
    boxHeight = availHeight;
    boxWidth = boxHeight * ratio;
  }

  const midWidth = width * 0.5;
  const midHeight = height * 0.5;

  return {
    tl: createVector(midWidth - boxWidth / 2, midHeight - boxHeight / 2),
    tr: createVector(midWidth + boxWidth / 2, midHeight - boxHeight / 2),
    br: createVector(midWidth + boxWidth / 2, midHeight + boxHeight / 2),
    bl: createVector(midWidth - boxWidth / 2, midHeight + boxHeight / 2),
  }
}

function randomize() {
  const rand = $fx.rand();
  if (rand < 0.005) {
    useFeedback = !useFeedback;
    seedChannelIndex = floor(random(seedChannels.length));
    reset();
  } else if (rand < 0.25) {
    seedChannelIndex = floor(random(seedChannels.length));
    initialize(true);
  } else {
    inputInt = floor(random(0, 6));
    activator = random();

    chunk = random([1, 2, 2, 2, 4, 4, 4, 8, 16]);
    useReverse = random() < 0.1;
    skrimMix = random([0, 0.25, 0.5, 0.5, 0.5, 0.75]);

    useGradientScrim = useReverse || random([true, false]);

    stMod = random(0.5, 1.8);

    pSortAlgo = random();
    useClear = random([true, false, false]);

    if (useClear) useReverse = false;
  }
}


function getColorMults() {
  const maxTries = 50;
  const thresh = 2 / 3;

  for (let i = 0; i < maxTries; i++) {
    rMult = random();
    gMult = random(0.85);
    bMult = random(0.9);

    // Check if at least one channel is above threshold (has a highlight)
    const hasHighlight = rMult >= thresh || gMult >= thresh || bMult >= thresh;

    if (hasHighlight) {
      // We found valid values that have at least one highlight
      return;
    }
  }

  // If we reach here after maxTries, just use the last generated values
  console.log("Max attempts reached in getColorMults");
}

function setUpFlower({ index, tl, tr, br, bl, focal }) {
  const minBoxDim = min(tr.x - tl.x, br.y - tr.y);
  const objectStrokeW = minBoxDim * 0.0125//0.0075
  const lineWidth = minBoxDim * random(0.03, 0.05)//0.0275;

  const foProps = [
    { tl, tr, br, bl, canvasStrokeW, strokeW: objectStrokeW, lineWidth },
  ];

  focalObjects[index] = new focal(...foProps);
}

function setUpBox({ index, tl, tr, br, bl }) { 
  const gap = minDim * 0.02;
  const n = minDim * 0.003
  useRanBorder = random() < 0.5;

  const getRan = () => useRanBorder ? random(-n, n) : 0;

  mainBoxes[index] = [];

  //main box
  for (let x = tl.x; x < tr.x - gap; x += gap) {
    mainBoxes[index].push(createVector(x + getRan(), tr.y + getRan()));
  }
  for (let y = tr.y; y < br.y - gap; y += gap) {
    mainBoxes[index].push(createVector(tr.x + getRan(), y + getRan()));
  }
  for (let x = br.x; x > bl.x + gap; x -= gap) {
    mainBoxes[index].push(createVector(x + getRan(), br.y + getRan()));
  }
  for (let y = br.y; y > tl.y + gap; y -= gap) {
    mainBoxes[index].push(createVector(bl.x + getRan(), y + getRan()));
  }
}

function draw() {

  if (resetting) return;

  if (frameRate() < (FR/2) && timeCounter > 0.25) {
    console.log("Frame Rate dip", frameRate());
  }

  drawFlowerStuff(petalBuffer);

  // TODO: delete this
  // drawText();


  ;[fxShader, feedbackShader].forEach((shdr, i) => {
    if (i === 0) {
      shdr.setUniform(`tl`, [initBoxCoords.tl.x / width, initBoxCoords.tl.y / height]);
      shdr.setUniform(`tr`, [initBoxCoords.tr.x / width, initBoxCoords.tr.y / height]);
      shdr.setUniform(`br`, [initBoxCoords.br.x / width, initBoxCoords.br.y / height]);
      shdr.setUniform(`bl`, [initBoxCoords.bl.x / width, initBoxCoords.bl.y / height]);
      shdr.setUniform("stMod", stMod);
      shdr.setUniform("staticMod", staticMod);
      shdr.setUniform("useGrayScale", useGrayScale);

      //TODO: delete this
      // shdr.setUniform("text", textBuffer);
    } else {
      shdr.setUniform("rMult", rMult);
      shdr.setUniform("gMult", gMult);
      shdr.setUniform("bMult", bMult);
      shdr.setUniform("inputInt", inputInt);
      shdr.setUniform("activator", activator);
      shdr.setUniform("useReverse", useReverse);
      shdr.setUniform("skrimMix", skrimMix);
      shdr.setUniform("pSortAlgo", pSortAlgo);
      shdr.setUniform("useGradientScrim", useGradientScrim);
      shdr.setUniform("ranStMult", ranStMult);
    }
    

    shdr.setUniform("u_flower", petalBuffer);
    shdr.setUniform("u_texture", currentBuffer);
    shdr.setUniform("u_resolution", [width, height]);
    shdr.setUniform("u_aspectRatio", aspectRatio);
    shdr.setUniform("u_time", timeCounter);
    shdr.setUniform("u_seed", seed);
    shdr.setUniform("u_mouse", [mX, mY]);
    shdr.setUniform("chunk", chunk);
    shdr.setUniform("useClear", useClear);
  });


  previousBuffer.shader(feedbackShader);
  previousBuffer.rect(-width / 2, -height / 2, width, height);

  // Swap buffers
  currentBuffer.image(previousBuffer, -width / 2, -height / 2, width, height);
  previousBuffer.clear();


  // Display the result on the main canvas
  fxBuffer.shader(fxShader);
  fxBuffer.rect(-width / 2, -height / 2, width, height);

  if (useFlipH || useFlipV) {

    const xScale = useFlipH ? -1 : 1;
    const yScale = useFlipV ? -1 : 1;
    const xPos = useFlipH ? -width : 0;
    const yPos = useFlipV ? -height : 0;
    push();
    scale(xScale, yScale); // Flip 
    image(fxBuffer, xPos, yPos, width, height);
    pop();

  } else {
    image(fxBuffer, 0, 0, width, height);
  }
  timeCounter += 1 / FR;

  if (!previewCaptured && timeCounter > 1) { 
    $fx.preview(); //captures image after 1 second
    previewCaptured = true;
  }
}


function drawFlowerStuff(mainCnv) {
  //CANVAS
  mainCnv.clear();

  if (useClear) return;

  //main
  mainCnv.fill(255 / 2, 0, 0);

  mainCnv.stroke("black");
  mainCnv.strokeWeight(canvasStrokeW);
  mainCnv.strokeCap(SQUARE);

  mainBoxes.forEach((mainBox) => {
    mainCnv.beginShape();
    if (useCurveVertex && useRanBorder) {
      mainBox.forEach((p) => mainCnv.curveVertex(p.x, p.y));
    } else {
      mainBox.forEach((p) => mainCnv.vertex(p.x, p.y));
    }
    mainCnv.endShape(CLOSE);
  });

  if (useFlipV) {
    mainCnv.push();
    mainCnv.translate(0, height); // Center the canvas
    mainCnv.scale(1, -1); // Flip vertically
  }

  focalObjects.forEach((focalObject) => {
    focalObject.draw(mainCnv);
  });
  if (useFlipV) mainCnv.pop();
}

function getDynamicSize() {
  const marginMult = 0.9;

  let originalRatio = initWidth / initHeight;
  const windowRatio = windowWidth / windowHeight;

  // if PORTRAIT, swap ratio
  if (windowRatio < 1) {
    originalRatio = 1 / originalRatio;
    usePortrait = true;
  } else {
    usePortrait = false;
  }

  let newWidth, newHeight;

  // Determine which dimension constrains the scaling
  if (windowRatio > originalRatio) {
    // Window is wider than original ratio, so height is the constraint
    newHeight = windowHeight;
    newWidth = newHeight * originalRatio;
  } else {
    // Window is taller than original ratio, so width is the constraint
    newWidth = windowWidth;
    newHeight = newWidth / originalRatio;
  }

  return {
    w: newWidth * marginMult,
    h: newHeight * marginMult
  }
}


function mousePressed() {
  mX = mouseX;
  mY = mouseY;

  if (useFlipH) mX = width - mX; // Adjust for flipped canvas
  if (useFlipV) mY = height - mY; 
}
function mouseDragged() {
  mX = mouseX;
  mY = mouseY;

  if (useFlipH) mX = width - mX;
  if (useFlipV) mY = height - mY;
}
function mouseReleased() {
  mX = 0;
  mY = 0;
}

function touchStarted() {
  mX = touches[0]?.x;
  mY = touches[0]?.y;
  
  if (useFlipH) mX = width - mX;
  if (useFlipV) mY = height - mY;
  return false; // Prevents default behavior like scrolling
}

function touchMoved() {
  mX = touches[0]?.x;
  mY = touches[0]?.y;

  if (useFlipH) mX = width - mX;
  if (useFlipV) mY = height - mY;
  return false; // Prevents default behavior like scrolling
}

function touchEnded() {
  mX = 0;
  mY = 0;
}

function keyPressed() {
  if (key == "p") {
    saveCanvas(`remember-${seed}`, "png");
  }

  if (key == "r") {
    useReverse = !useReverse;
  }
  if (key == "c") {
    useClear = !useClear
    if (useClear) {
      wasReverse = useReverse;
      useReverse = false
    } else {
      if( wasReverse) {
        useReverse = true;
      }

    }
  }

  if (key == "f") { 
    useFeedback = !useFeedback;
    reset()
  }

  if (key == "e") {
    if (glitchingTimeId) {
      clearInterval(glitchingTimeId);
      glitchingTimeId = false;
    } else {
      setRandomInterval();
    }
  }

  if (keyCode == LEFT_ARROW) {
    seedChannelIndex =
      (seedChannelIndex - 1 + seedChannels.length) % seedChannels.length;
    initialize();
  }
  if (keyCode == RIGHT_ARROW) {
    seedChannelIndex = (seedChannelIndex + 1) % seedChannels.length;
    initialize();
  }

  if (keyCode == DOWN_ARROW) {
    chunk /= 2;
    if (chunk < 1) chunk = 1;
  }

  if (keyCode == UP_ARROW) {
    chunk *= 2;
    if (chunk > 16) chunk = 16;
  }

}

function setRandomInterval() {
  const t = 250 + Math.random(1500)
  glitchingTimeId = setTimeout(() => {
    randomize();
    setRandomInterval();
  }, t);
}

function reset() {
  noLoop();
  resetting = true;

  currentBuffer.remove();
  previousBuffer.remove();
  fxBuffer.remove();
  petalBuffer.remove();
  currentBuffer = undefined;
  previousBuffer = undefined;
  fxBuffer = undefined;
  petalBuffer = undefined;

  p5canvas.remove();
  p5canvas = undefined;

  fxShader = undefined;
  feedbackShader = undefined;

  setup();
  resetting = false;
  loop();
}

//debounce resize
let resizeTimeout;

function windowResized() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    reset();
  }, 100); //debounce time
}

const vertex = `
#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vTexCoord.y = 1.0 - vTexCoord.y;

  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  
  gl_Position = positionVec4;
}
`;

const feedbackFrag = `
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPSILON 0.00001
#define min_param_a 0.0 + EPSILON
#define max_param_a 1.0 - EPSILON

uniform sampler2D u_texture;
uniform sampler2D u_flower;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform vec2 u_mouse;
uniform vec2 u_aspectRatio;
uniform int u_stage;
uniform float rMult;
uniform float gMult;
uniform float bMult;
uniform float chunk;
uniform bool useReverse;
uniform bool useClear;
uniform float skrimMix;
uniform float pSortAlgo;
uniform bool useGradientScrim;
uniform int inputInt;
uniform float activator;
uniform float ranStMult;

varying vec2 vTexCoord;

// 01000101 01010110 00110011


//UTIL
float map(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
    return outputMin + ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin));
}

float random(in vec2 _st) {
  vec2 st = _st + u_seed;
  
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
float random(in float _x){
    float x = _x + u_seed;

    return fract(sin(x)*1e4);
}

vec2 random2(vec2 _st){
    vec2 st = _st + u_seed;

    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float noise(vec2 _st) {
  vec2 st = _st + u_seed;

    vec2 i = floor(st);
    vec2 f = fract(st);

    // vec2 u = f*f*(3.0-2.0*f);
    vec2 u = f*f*f*(f*(f*6.-15.)+10.); //improved smoothstep

    float n = mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);

    return 0.5 + 0.5 * n;
}

float noiseNegNeutralPos(vec2 st) {
  float r = noise(st);
  if (r < 0.45) {
    return -1.0;
  } else if (r < 0.55) {
    return 0.0;
  } else {
    return 1.0;
  }
}

float randomNegNeutralPos(vec2 st) {
  float r = random(st);
  if (r < 0.33) {
    return -1.0;
  } else if (r < 0.66) {
    return .0;
  } else {
    return 1.0;
  }
}

float noiseOnOff(vec2 st) {
  return floor(noise(st) + 0.5);
}
float randomOnOff(vec2 st) {
  return floor(random(st) + .5);
}

float whirls(vec2 st) {
  st.x *= u_resolution.x/u_resolution.y;

  float noiseMod = 2. + (sin(u_time*.2)*.5);

  float moveMult = u_time * .25 + sin(u_time * .25) * .1;

  st.x -= sin(moveMult * 2.) * 0.05;
  st.y -= cos(moveMult) * 0.05;
  st += vec2(0, moveMult * .05);

  st += noise(st*3.) * noiseMod;
  st.x -= u_time * 0.02;

  float splat = noise(st * 4. + 50.); 


  return splat;
}


float spiral(vec2 st) {
  vec2 uv = st * 2.0 - 1.0;
  uv *= u_aspectRatio;
  float t = u_time * 0.25;

  float modi = map(sin(t), -1., 1., 0.33, PI);
  // Convert to polar coordinates
  float r = length(uv) * modi ;
  float theta = atan(uv.y, uv.x);

  // Create the spiral pattern
  float thresh = PI / 3.;


  return mod(r - (theta + t * 2.) * .5, thresh);
}

float drip(vec2 st) {
  vec2 center = vec2(0.5) * u_aspectRatio;
  float dist = distance(st * u_aspectRatio, center);

  return 1.0-fract(dist - u_time * 0.033 + (sin(u_time * .75)) * 0.1);
}

//MAIN =========================================================
void main() {
  vec2 st = vTexCoord;
  vec2 orgSt = st;


  vec2 norm_mouse = u_mouse / u_resolution;
  float screenAspectRatio = u_resolution.x / u_resolution.y;



  vec2 blockSize = vec2(chunk / u_resolution.x, chunk / u_resolution.y);

  vec2 posBlockFloor = floor(st / blockSize) ;
  vec2 posBlockOffset = fract(st / blockSize) ;

  vec2 blockSt = posBlockFloor * blockSize;

  vec2 correctedMousePos = vec2(norm_mouse.x * screenAspectRatio, norm_mouse.y );
  vec2 correctedUV = vec2(blockSt.x * screenAspectRatio, blockSt.y );

  float t = u_time * ranStMult;

  float squares = floor(10. + random(u_seed + 100.) * 200.);
  float waves = floor(10. + random(u_seed + 200.) * 200.);
  
  vec4 orgColor = vec4(0.0, 0.0, 0.0, 1.0);

  float radius = 1./6.; // Size of the circle radius
  float fadeWidth = 0.5; // Width of the fade effect at the edges
  float distNoise = noise(st * 8. + t * 0.5) * 0.1;
  float mouseDist = norm_mouse == vec2(0) ? 1. :  distance(correctedMousePos, correctedUV) + distNoise;
  float displaceIntensity = smoothstep(radius + fadeWidth, radius - fadeWidth, mouseDist);
  bool mouseInView = u_mouse.x > u_resolution.x * 0.01 && u_mouse.y > u_resolution.y * 0.01 && u_mouse.x < u_resolution.x*0.99 && u_mouse.y < u_resolution.y*0.99;
  
  if(!mouseInView) {
    displaceIntensity = 0.0;
  }

  bool useMag = displaceIntensity > 0.5;//  && random(blockSt) < map(displaceIntensity, 0.5, .575, 0.0, 1.0);

  if(useMag) {
    float magDiv = 2.;
    squares = ceil(squares / magDiv);
    waves = ceil(waves / magDiv);
  }


  vec4 petalColor = texture2D(u_flower, blockSt);

  float div = 1.0;
  float borderDiv = 128.;//64
  if(useReverse) {
    div = 100000.;//big enough so squares and waves are 1
    if(petalColor.a > 0.1) {
      if( petalColor.r < 0.33) {
        div = borderDiv;
      } else if( petalColor.r < 0.66) {
        div = 1.;
      } else {
        // div = 4.;
      }
    }
  } else {
    
    if(petalColor.a > 0.1) {
      if( petalColor.r < 0.33) {
        div = borderDiv;
      } else if( petalColor.r < 0.66) {
        div = 100000.;
      } else {
        div = 1.;
      }
    }
  }


  squares = ceil(squares / div);
  waves = ceil(waves / div);

  float rInput, gInput, bInput;

  if(inputInt == 0) {
    rInput = st.y;
    gInput = st.x - st.y;
    bInput = st.y + st.x;
  } else if (inputInt == 1) {
    rInput = st.x;
    gInput = st.y + st.x;
    bInput = st.y - st.x;
  } else if (inputInt == 2) {
    rInput = st.x + st.y;
    gInput = st.y;
    bInput = st.x - st.y;
  } else if (inputInt == 3) {
    rInput = st.y - st.x;
    gInput = st.x ;
    bInput = st.y + st.y;
  } else if (inputInt == 4) {
    rInput = st.x + st.y;
    gInput = st.x - st.y;
    bInput = st.y;
  } else {
    rInput = st.y - st.x;
    gInput = st.y + st.x;
    bInput = st.x;
  }



  float rParam = sin(0.031 + rInput * TWO_PI * waves) * .5 + .5;
  float gParam = sin(0.032 + gInput * TWO_PI * waves ) * .5 + .5;
  float bParam = sin(0.033 + bInput * TWO_PI * waves ) * .5 + .5;

  orgColor.r = fract(rParam * squares) * rMult;
  orgColor.g = fract(gParam * squares) * gMult;
  orgColor.b = fract(bParam * squares) * bMult;


  float timeOffset = fract(t * 0.0001);

  if (random(ranStMult * 100. * blockSt + timeOffset) < 0.25) {
    float rangeMult = 0.3;
    if(petalColor.a > 0.1 && petalColor.r < 0.66) {
      rangeMult = 0.1;
    }

    float range = 0.1 + random(u_seed + 1000.) * rangeMult;
    orgColor.r += map(random(blockSt * 10. + timeOffset + 100.), 0.,1., -range, range);
    orgColor.g += map(random(blockSt * 10. + timeOffset + 200.), 0.,1., -range, range);
    orgColor.b += map(random(blockSt * 10. + timeOffset + 300.), 0.,1., -range, range);
  }

  if(petalColor.a < 0.1 && !useMag && !useClear) {
    vec4 baseColor = vec4(vec3(rMult, gMult, bMult) * .5, 1.0);

    if (useGradientScrim) {
      vec4 baseGrad = vec4(0.0, 0.0, 0.0, 1.0);

      float rParam = sin(1.0 - rInput * TWO_PI) * .5 + .5;
      float gParam = sin(1.0 - gInput * TWO_PI ) * .5 + .5;
      float bParam = sin(1.0 - bInput * TWO_PI ) * .5 + .5;

      baseGrad.r = fract(rParam) * rMult;
      baseGrad.g = fract(gParam) * gMult;
      baseGrad.b = fract(bParam) * bMult;
      baseGrad = mix(baseGrad, baseColor, 0.5);

      orgColor = mix(orgColor, baseGrad, skrimMix);

    } else {
     
      orgColor = mix(orgColor, baseColor, skrimMix);
    }
  }

  bool noSort;
  if(useReverse) {
    noSort = petalColor.a < 0.1 || petalColor.r < 0.33 || petalColor.r > 0.66;;
  } else {
    noSort = petalColor.a > 0.1 && petalColor.r < 0.66;
  }

  if (u_time < .05 || useMag || noSort) {
    gl_FragColor = orgColor;
    return;
  }
 

  vec4 color = texture2D(u_texture, st);

  float sortThresh = 0.5 + sin(PI * u_seed + t * .25) * 0.05;


  float activatorDiv  = 1./4.;
  float sValue;
  float speedThreshMult;

  if(activator < activatorDiv) {
    sValue = whirls(blockSt * .75);
    speedThreshMult = 0.75;
  } else if(activator < activatorDiv*2.) {
    sValue = spiral(blockSt);
    speedThreshMult = 0.5;
  } else if (activator < activatorDiv*3.) {
    sValue = noise(blockSt * 2. + t * 0.1);
    speedThreshMult = 0.75;
  } else {
    sValue = drip(blockSt);
    speedThreshMult = 0.5;
  }

  bool isFlower = petalColor.a > 0.1 && petalColor.r > 0.75; 

  bool useSort = sValue + random(blockSt) * 0.05 < sortThresh;
 
  if(useSort) {
    color = vec4(0.0, 0.0, 0.0, 1.0);
    vec2 noiseMult = vec2(.01);

    vec2 belowBlock = posBlockFloor + vec2(-1.0, -1.0);
    vec4 belowCheck = texture2D(u_texture, belowBlock * blockSize);
    float belowBrightness = (belowCheck.r + belowCheck.g + belowCheck.b) / 3.0;

    float speed = sValue < sortThresh * speedThreshMult ? -1.0 : 1.0;

    if(pSortAlgo < 0.5) {
      if(belowBrightness < 0.25) {
        posBlockFloor.x -= speed;
      } else if(belowBrightness < 0.5) {
        posBlockFloor.y += speed;
      } else if(belowBrightness < 0.75) {
        posBlockFloor.x += speed;
      } else {
        posBlockFloor.y -= speed;
      }
    } else {
      if(belowBrightness < 0.25) {
        posBlockFloor.y -= speed;
      } else if(belowBrightness < 0.5) {
        posBlockFloor.x -= speed;
      } else if(belowBrightness < 0.75) {
        posBlockFloor.x += speed;
      } else {
        posBlockFloor.y += speed;
      }
    }

    vec2 blockSt = (posBlockFloor + posBlockOffset) * blockSize;
    color = texture2D(u_texture, blockSt);
  } else {
    float timeMult = 1. + (6.-ranStMult);

    if(random(ranStMult * posBlockFloor * 100. + u_time * timeMult) < 0.1 * ranStMult) {
      color = orgColor;
    }
  }

  gl_FragColor = color;
}
`;

const fxFrag = `
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPSILON 0.00001
#define min_param_a 0.0 + EPSILON
#define max_param_a 1.0 - EPSILON

uniform sampler2D u_texture;
uniform sampler2D u_flower;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform vec2 u_mouse;
uniform vec2 u_aspectRatio;
uniform vec2 tl;
uniform vec2 br;
uniform vec2 tr;
uniform vec2 bl;
uniform float chunk;
uniform bool useClear;
uniform float stMod;
uniform float staticMod;
uniform bool useGrayScale;

varying vec2 vTexCoord;

// 01000101 01010110 00110011

//UTIL
float map(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
    return outputMin + ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin));
}

float random(in vec2 _st) {
  vec2 st = _st; + fract(u_seed);
  
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
float random(in float _x){
    float x = _x + fract(u_seed);

    return fract(sin(x)*1e4);
}

vec2 random2(vec2 _st){
    vec2 st = _st + fract(u_seed);

    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float noise(vec2 _st) {
  vec2 st = _st + fract(u_seed);

    vec2 i = floor(st);
    vec2 f = fract(st);

    // vec2 u = f*f*(3.0-2.0*f);
    vec2 u = f*f*f*(f*(f*6.-15.)+10.); //improved smoothstep

    float n = mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);

    // return n;
    return 0.5 + 0.5 * n;
}

float noiseNegNeutralPos(vec2 st) {
  float r = noise(st);
  if (r < 0.4) {
    return -1.0;
  } else if (r < 0.6) {
    return 0.0;
  } else {
    return 1.0;
  }
}

float randomNegNeutralPos(vec2 st) {
  float r = random(st);
  if (r < 0.33) {
    return -1.0;
  } else if (r < 0.66) {
    return .0;
  } else {
    return 1.0;
  }
}

float noiseNegPos(vec2 st) {
  return noise(st) < 0.5 ? -1.0 : 1.0;
}

float randomNegPos(vec2 st) {
  return floor(random(st) * 3.0) - 1.0;
}

float noiseOnOff(vec2 st) {
  return floor(noise(st) + 0.5);
}
float randomOnOff(vec2 st) {
  return floor(random(st) + 0.5);
}

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
}

float tri(float x) {
  return abs(fract(x) - 0.5) * 4.0 - 1.0;
}

vec3 compress(vec3 col) {
  return 0.5 * (1.0 - cos(col * PI)); // Sine wave to bias toward 0 or 1
}

vec4 edgeDetection(vec2 _st, float intensity, sampler2D tex) {
  vec2 onePixel = vec2(1.0) / u_resolution * intensity; //intensity is just to scale the line width down

  float kernel[9];
  vec3 sampleTex[9];

  for (int i = 0; i < 3; ++i) {
    for (int j = 0; j < 3; ++j) {
      sampleTex[i * 3 + j] = texture2D(tex, _st + onePixel * vec2(i-1, j-1)).rgb;
    }
  }

  // Sobel filter kernels for horizontal and vertical edge detection
  float Gx[9];
  Gx[0] = -1.0; Gx[1] = 0.0; Gx[2] = 1.0;
  Gx[3] = -2.0; Gx[4] = 0.0; Gx[5] = 2.0;
  Gx[6] = -1.0; Gx[7] = 0.0; Gx[8] = 1.0;

  float Gy[9];
  Gy[0] = -1.0; Gy[1] = -2.0; Gy[2] = -1.0;
  Gy[3] = 0.0; Gy[4] = 0.0; Gy[5] = 0.0;
  Gy[6] = 1.0; Gy[7] = 2.0; Gy[8] = 1.0;


  vec3 edge = vec3(0.0);
  for (int k = 0; k < 9; k++) {
    edge.x += dot(sampleTex[k], vec3(0.299, 0.587, 0.114)) * Gx[k];
    edge.y += dot(sampleTex[k], vec3(0.299, 0.587, 0.114)) * Gy[k];
  }

  float edgeStrength = length(edge);

  vec4 edgeColor = vec4(vec3(edgeStrength), 1.0);

  return edgeColor;
}

vec3 contrast(vec3 color, float contrastFactor) {
  // Adjust contrast using a simple formula
  return mix(vec3(0.5), color, contrastFactor);
}

vec3 saturation(vec3 color, float saturationFactor) {
  // Convert RGB to grayscale
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  // Mix the original color with the grayscale value
  return mix(vec3(gray), color, saturationFactor);
}

vec2 stZoom(vec2 st, float zoomFactor) {
  // Zoom in on the center of the texture
  vec2 center = vec2(0.5);
  return (st - center) * zoomFactor + center;
}
//MAIN =========================================================
void main() {
  vec2 st = vTexCoord;  
  vec2 orgSt = st;

    // // Apply a radial distortion
  float strength = .15;
  vec2 cent = vec2(0.5);
  vec2 delta = st - cent;
  float distC = length(delta);
  float factor = 1.0 + strength * distC * distC;
  st = cent + delta * factor;

  st = stZoom(st, 1. - strength * 0.13);

  vec2 blockSize = vec2(chunk / u_resolution.x, chunk / u_resolution.y);

  vec2 posBlockFloor = floor(st / blockSize) ;
  vec2 posBlockOffset = fract(st / blockSize) ;

  vec2 blockSt = posBlockFloor * blockSize;

  vec2 norm_mouse = u_mouse / u_resolution;
  vec2 correctedMousePos = vec2(norm_mouse.x, norm_mouse.y ) * u_aspectRatio;
  vec2 correctedUV = vec2(st.x, st.y ) * u_aspectRatio;


  
  vec4 color = texture2D(u_texture, st);
  vec4 petalColor = texture2D(u_flower, blockSt);


  float altMult = 1.;

  if(petalColor.a > .1) {
    if(petalColor.r < 0.33) {
      color.rgb -= 0.2 * altMult;
    } else if( petalColor.r < 0.66) {
      color.rgb -= 0.1 * altMult;
    } else {
      color.rgb += 0.05 * altMult;
    } 
  } 


  //border effects
  bool inBox = st.x > tl.x  && st.x < br.x + blockSize.x && st.y > tl.y && st.y < br.y + blockSize.y;
  bool boxBg = petalColor.a > 0.1 && petalColor.r < 0.66 && petalColor.r > 0.33;

  if(!useClear) {
    if(inBox && boxBg) {
      vec2 innerBorderWidth = vec2(0.015) * vec2(u_aspectRatio.y, u_aspectRatio.x);

      vec3 border = color.rgb;
      if(blockSt.x < tl.x + innerBorderWidth.x) {
        border /= smoothstep(0.0, innerBorderWidth.x, blockSt.x - tl.x);
      }
      if(blockSt.x > br.x - innerBorderWidth.x) {
        border /= 1.0 - smoothstep(br.x - innerBorderWidth.x, br.x, blockSt.x);
      }
      if(blockSt.y < tl.y + innerBorderWidth.y) {
        border /= smoothstep(0.0, innerBorderWidth.y, blockSt.y - tl.y);
      }
      if(blockSt.y > br.y - innerBorderWidth.y) {
        border /= 1.0 - smoothstep(br.y - innerBorderWidth.y, br.y, blockSt.y);
      }

      border = clamp(border, 0.0, 2.);

      //inner light
      color.rgb = mix(color.rgb, border, .8);
    }      
    // } else if(petalColor.a < 0.1) {
    //   vec2 outerBorderWidth = vec2(0.05) * vec2(u_aspectRatio.y, u_aspectRatio.x);
    //   vec3 border = color.rgb;

    //   // Smoothstep functions for the four sides
    //   float horizontalLeft = smoothstep(0.0, outerBorderWidth.x, tl.x - st.x);
    //   float horizontalRight = smoothstep(0.0, outerBorderWidth.x, st.x - br.x);
    //   float verticalTop = smoothstep(0.0, outerBorderWidth.y, tl.y - st.y);
    //   float verticalBottom = smoothstep(0.0, outerBorderWidth.y, st.y - br.y);

    //   // Horizontal and vertical
    //   if(st.x > tl.x - outerBorderWidth.x && st.x < tl.x) {
    //       border *= horizontalLeft;
    //   }
    //   if(st.x < br.x + outerBorderWidth.x && st.x > br.x) {
    //       border *= horizontalRight;
    //   }
    //   if(st.y > tl.y - outerBorderWidth.y && st.y < tl.y) {
    //       border *= verticalTop;
    //   }
    //   if(st.y < br.y + outerBorderWidth.y && st.y > br.y) {
    //       border *= verticalBottom;
    //   }


    //   // Corners 
    //   if(st.x < tl.x && st.y < tl.y) {
    //       border = color.rgb * max(horizontalLeft, verticalTop);
    //   }
    //   if(st.x > br.x && st.y < tl.y) {
    //       border = color.rgb * max(horizontalRight, verticalTop);
    //   }
    //   if(st.x < tl.x && st.y > br.y) {
    //       border = color.rgb * max(horizontalLeft, verticalBottom);
    //   }
    //   if(st.x > br.x && st.y > br.y) {
    //       border = color.rgb * max(horizontalRight, verticalBottom);
    //   }
      
    //   border = clamp(border, 0.0, 1.0);

    //   //outer shadow
    //   color.rgb = mix(color.rgb, border, .1);

    // }
  }

  if(petalColor.a > 0.1 && petalColor.r < 0.33) {
    color.rgb += edgeDetection(blockSt, 2.0, u_flower).rgb * 0.15;
  }

  // color.rgb = saturation(color.rgb, 1.4);
  // color.rgb = contrast(color.rgb, 1.25);
  color.rgb = saturation(color.rgb, 1.5);
  color.rgb = contrast(color.rgb, 1.3);

  //grayscale
  if(useGrayScale) {
    color.rgb = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114))); //retro
  }

  //static
  vec4 preColor = color;

  float staticDirection = randomNegPos(st * stMod + fract(u_time * 0.001) + 100.);
  color.rgb += random(st * stMod + fract(u_time * 0.001)) * staticMod * staticDirection;

  //vignette effect
  float distFromCenter = distance(st, vec2(.5));
  color.rgb += smoothstep(1., -1., distFromCenter); //light center
  color.rgb *= smoothstep(.72, .4, distFromCenter); //corners

  float borderWidth = .015;

  if (st.x < borderWidth) {
    color.rgb *= smoothstep(0., borderWidth, st.x);
  }
  if (st.x > 1.0 - borderWidth) {
    color.rgb *=1.0- smoothstep(1.0 - borderWidth, 1.0, st.x);
  }
  if (st.y < borderWidth) {
    color.rgb *= smoothstep(0., borderWidth, st.y);
  }
  if (st.y > 1.0 - borderWidth) {
    color.rgb *=1.0- smoothstep(1.0 - borderWidth, 1.0, st.y);
  }

  color.rgb = mix(color.rgb, preColor.rgb, 0.15);
  

  gl_FragColor = color;
}
`;