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


function preload() {
  try {  
    fxShader = loadShader('./vertex.glsl', './fxFrag.glsl');
    feedbackShader = loadShader('./vertex.glsl', './feedbackFrag.glsl');


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
    }
    button.addEventListener("click", handleNewHash);
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleNewHash()
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
      seedChannels = [
        seed,
        seed + 111,
        seed + 222,
      ]
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

  stMod = random(0.5, 2);

  staticMod = 0.15;
  const staticChance = random();
  if (staticChance < 0.04) {
    staticMod = random([0, 0.35]);
  } else if (staticChance < 0.14) {
    staticMod = random([0.05, 0.25]);
  } else {
    staticMod = random([0.1, 0.15, 0.2]);
  }

  pSortAlgo = random();
  useCurveVertex = random([true, false]);

  useGrayScale = random() < 0.02;

  minDim = min(width, height);
  canvasStrokeW = minDim * 0.03;

  ranStMult = random([
    random(0.01, 0.1),//very low
    random(0.1, 0.5),//low
    random(0.5, 1.5),//medium
    random(1.5, 3),//high
    random(3, 5),//very high
  ])

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
  };
  console.log(attributes)

  $fx.features(attributes);
}

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
    case 0.05:
      static = "low"
      break;
    case 0.25:
      static = "high"
      break;
    case 0.35:
      static = "max"
      break;
    default:
      static = "medium";
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
  //(0.66+0.8) to (1+1) //lower is further from center

  let distortion = "error";
  if (totalFeedbackMod < 1.64) {
    distortion = "high";
  } else if (totalFeedbackMod < 1.82) {
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
  if (rand < 0.025) {
    useFeedback = !useFeedback;
    seedChannelIndex = floor(random(seedChannels.length));
    reset()
  } else if (rand < 0.25) {
    seedChannelIndex = floor(random(seedChannels.length));
    initialize(true)
  } else {
    chunk = random([1, 2, 2, 2, 4, 4, 4, 8]);
    useReverse = random() < 0.2;
    skrimMix = random([0, 0.25, 0.5, 0.5, 0.5, 0.75]);
    useGrayScale = random() < 0.03;
  
    useGradientScrim = skrimMix === 1 || useReverse || random([true, false]);
    pSortAlgo = random();
    useClear = random([true, false, false]);

    if (useClear) useReverse = false;
  }
}

function getColorMults() {
  getColorTry++;

  rMult = random();
  gMult = random(0.75);
  bMult = random(0.9);

  if (getColorTry > 50) return

  const thresh = .75;
  const noHighlight = rMult < thresh && gMult < thresh && bMult < thresh;
  const tooDark = false//rMult + gMult + bMult < 1;
  if (noHighlight || tooDark) {
    getColorMults();
  }
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


  ;[fxShader, feedbackShader].forEach((shdr, i) => {
    if (i === 0) {
      shdr.setUniform(`tl`, [initBoxCoords.tl.x / width, initBoxCoords.tl.y / height]);
      shdr.setUniform(`tr`, [initBoxCoords.tr.x / width, initBoxCoords.tr.y / height]);
      shdr.setUniform(`br`, [initBoxCoords.br.x / width, initBoxCoords.br.y / height]);
      shdr.setUniform(`bl`, [initBoxCoords.bl.x / width, initBoxCoords.bl.y / height]);
      shdr.setUniform("stMod", stMod);
      shdr.setUniform("staticMod", staticMod);
      shdr.setUniform("useGrayScale", useGrayScale);

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

  if (timeCounter === FR * 1) { 
    $fx.preview(); //captures image after 1 second
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
  const t = 200 + Math.random(2000)
  glitchingTimeId = setTimeout(() => {
    randomize();
    setRandomInterval();
  }, t);
}


function reset() {
  noLoop();
  resetting = true;

  currentBuffer.remove()
  previousBuffer.remove();
  fxBuffer.remove();
  petalBuffer.remove();
  currentBuffer = undefined;
  previousBuffer = undefined;
  fxBuffer = undefined;
  petalBuffer = undefined;

  p5canvas.remove();
  p5canvas = undefined;
 
  preload();
  setTimeout(() => {
    setup();
    resetting = false;
    loop();
  }, 500); // Wait for shaders to load
}


//debounce resize
let resizeTimeout;

function windowResized() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    reset();
  }, 100); //debounce time
}
