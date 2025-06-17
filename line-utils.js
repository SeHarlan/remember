function makeStrokePoints({
  lineVectors,
  lineWidth,
  internalDivision = 0,
  edgeDivision = 0,
  maxNoise = 0,
  noiseOffsetRatio = 0.1,
  maxEdgeNoise = 0,
  useRandomEdges = false
}) {
  const topPoints = []
  const bottomPoints = []
  const internalPoints = [[]]
  const steps = lineVectors.length
  for (let i = 0; i < steps - 3; i++) {
    const t = 0
    fillTangentPoints({
      lineVectors,
      topPoints,
      bottomPoints,
      index: i,
      t,
      internalDivision,
      edgeDivision,
      internalPoints,
      lineWidth,
      maxEdgeNoise,
      maxNoise,
      noiseOffsetRatio,
      useRandomEdges
    })
  }
  for (let t = 1 / 3; t <= 1; t += 1 / 3) {
    const i = steps - 4
    fillTangentPoints({
      lineVectors,
      topPoints,
      bottomPoints,
      index: i,
      t,
      internalDivision,
      edgeDivision,
      internalPoints,
      lineWidth,
      maxEdgeNoise,
      maxNoise,
      noiseOffsetRatio,
      useRandomEdges
    })
  }
  const borderPoints = [...topPoints, ...bottomPoints.reverse()]
  return { borderPoints, internalPoints }
}


function fillTangentPoints({
  lineVectors,
  topPoints,
  bottomPoints,
  internalPoints,
  lineWidth,
  index,
  t,
  internalDivision,
  edgeDivision,
  maxNoise,
  maxEdgeNoise,
  noiseOffsetRatio,
  useRandomEdges
}) {
  const p0 = lineVectors[index]
  const p1 = lineVectors[index + 1]
  const p2 = lineVectors[index + 2]
  const p3 = lineVectors[index + 3]
  let x = bezierPoint(p0.x, p1.x, p2.x, p3.x, t);
  let y = bezierPoint(p0.y, p1.y, p2.y, p3.y, t);
  let tx = bezierTangent(p0.x, p1.x, p2.x, p3.x, t);
  let ty = bezierTangent(p0.y, p1.y, p2.y, p3.y, t);
  let a = atan2(ty, tx);
  const oppA = a + HALF_PI;
  a -= HALF_PI;

  let w = lineWidth

  const n = maxNoise ? map(noise((index + (t * 3)) * noiseOffsetRatio), 0, 1, 0, maxNoise) : 0;
  w += n

  //Main Border Points
  const topX = cos(a) * w + x;
  const topY = sin(a) * w + y;
  const bottomX = cos(oppA) * w + x;
  const bottomY = sin(oppA) * w + y;

  const topVector = createVector(topX, topY)
  const bottomVector = createVector(bottomX, bottomY)

  const edgeSpace = 1 / edgeDivision;

  function getEdgeNoiseV(t) {
    const edgeNoiseV = p5.Vector.fromAngle(a - radians(90));
    if (useRandomEdges) {
      const randRange = map(abs(0.5 - t), 0, 0.6, maxEdgeNoise, 0, true)
      edgeNoiseV.setMag(random(0, randRange))
    } else {
      const noiseRange = map(abs(0.5 - t), 0, 1, maxEdgeNoise, 0, true)
      edgeNoiseV.setMag(map(noise(t * 10 * noiseOffsetRatio), 0, 1, 0, noiseRange))
    }
    return edgeNoiseV
  }

  //Starting edge lines
  if (index === 0 && edgeDivision) {
    for (let t = edgeSpace; t <= 1 - edgeSpace; t += edgeSpace) {
      const edgeV = p5.Vector.lerp(bottomVector, topVector, t);

      if (maxEdgeNoise) {
        const noiseV = getEdgeNoiseV(t)
        edgeV.add(noiseV)
      }

      topPoints.push(edgeV)
    }
  }

  // Main Border Points
  topPoints.push(topVector)
  bottomPoints.push(bottomVector)

  // Ending edge lines
  if (index === lineVectors.length - 4 && t === 1 && edgeDivision) {
    for (let t = edgeSpace; t <= 1 - edgeSpace; t += edgeSpace) {
      const edgeV = p5.Vector.lerp(bottomVector, topVector, t)

      if (maxEdgeNoise) {
        const noiseV = getEdgeNoiseV(t)
        edgeV.sub(noiseV)
      }

      bottomPoints.push(edgeV)
    }
  }

  if (!internalDivision) return
  //Interenal Points
  let IPIndex = 0
  const internalSpace = 1 / internalDivision
  //Int Top Points 
  for (let t = 0; t <= 1; t += internalSpace) {
    if (!internalPoints[IPIndex]) internalPoints.push([])

    const internalV = p5.Vector.lerp(topVector, bottomVector, t)
    internalV.angle = a + radians(90)
    internalPoints[IPIndex].push(internalV)
    IPIndex++
  }
}

function getCubicBezierVectors(p0, p1, p2, p3, t) {
  const adjustedT = 1 - t;
  const x = (
    Math.pow(adjustedT, 3) * p0.x +
    3 * Math.pow(adjustedT, 2) * t * p1.x +
    3 * adjustedT * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x
  );
  const y = (
    Math.pow(adjustedT, 3) * p0.y +
    3 * Math.pow(adjustedT, 2) * t * p1.y +
    3 * adjustedT * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y
  );
  return createVector(x, y)
}

function makeCurvyPoly(
    x,
    y,
    r,
    sides,
    startingAngle = random(TWO_PI),
    randRange = 0,
    aOff = random(1000)
  ) {
    const angle = TWO_PI / sides;
    const points = [];
    for (let a = -angle; a <= TWO_PI + angle; a += angle) {
      const n = noise(aOff + (a % TWO_PI) * 2.1);
      const radius = r + map(n, 0, 1, -randRange, randRange);
      const sx = x + cos(a + startingAngle) * radius;
      const sy = y + sin(a + startingAngle) * radius;
      points.push(createVector(sx, sy));
    }
    return points;
}
  
function getCentroid(points) {
  let area = 0;
  let centroidX = 0;
  let centroidY = 0;
  let n = points.length;

  for (let i = 0; i < n; i++) {
    let j = (i + 1) % n; // Wrap around to the first vertex

    let xi = points[i].x;
    let yi = points[i].y;
    let xj = points[j].x;
    let yj = points[j].y;

    let a = xi * yj - xj * yi;
    area += a;
    centroidX += (xi + xj) * a;
    centroidY += (yi + yj) * a;
  }

  area *= 0.5;
  centroidX /= 6 * area;
  centroidY /= 6 * area;

  return { x: centroidX, y: centroidY };
}