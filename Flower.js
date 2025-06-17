class Flower {
  constructor({ tl, tr, br, bl, strokeW, canvasStrokeW, lineWidth }) {
    this.lineWidth = lineWidth * 0.8
    this.strokeW = strokeW;
    this.boxVertCenter = (br.y + tr.y) / 2;
    this.boxHorCenter = (tr.x + tl.x) / 2;
    this.boxHeight = br.y - tr.y;
    this.tl = tl;
    this.tr = tr;

    const offRange = this.lineWidth * random(2, 13)//6;
    const getPointOffset = (offMult = 1) =>
      random(-offMult * offRange, offMult * offRange);

    const focalY = tr.y + this.boxHeight * 0.25

    let hFocalMod = getPointOffset(3);

    if (widthModMult < 0.76) {
      hFocalMod = -abs(hFocalMod);
    }

    const p0 = createVector(this.boxHorCenter, br.y - canvasStrokeW * 0.45);
    const p1 = createVector(
      this.boxHorCenter + getPointOffset(2),
      this.boxVertCenter + getPointOffset() + this.boxHeight * 0.2
    );
    const p2 = createVector(
      this.boxHorCenter + getPointOffset(2),
      this.boxVertCenter + getPointOffset() - this.boxHeight * 0.2
    );
    const p3 = createVector(
      this.boxHorCenter + hFocalMod,
      focalY + getPointOffset()
    );

    const lineVectors = [];
    const stepLength = random(0.05, 0.1)//0.04;

    for (let t = 0; t <= 1 + Number.EPSILON; t += stepLength) {
      const v = getCubicBezierVectors(p0, p1, p2, p3, t);
      lineVectors.push(v);
    }

    const curvePoints = makeStrokePoints({
      lineVectors,
      lineWidth: this.lineWidth,
      internalDivision: 6,
      edgeDivision: 0,
      maxNoise: lineWidth * 0,
    });

    this.borderPoints = curvePoints.borderPoints;
    this.internalPoints = curvePoints.internalPoints;

    this.squigglePoints = [p0, p0];
    this.petalPoints = [];

    this.shapeSides = floor(random(3, 11));
    this.gemPoints = [];

    this.noiseRangeMult = random(0.5, 3);

    this.attempts = 0;

    this.squiggle(1, 0);

    this.focalPoint = this.squigglePoints[this.squigglePoints.length - 3];

    this.makePetals();



    this.gemCenters = [p1, p2]
    
    //find angle between the two gem centers
    //make point along the same accesss with equal distance
    const angle = atan2(
      this.gemCenters[1].y - this.gemCenters[0].y,
      this.gemCenters[1].x - this.gemCenters[0].x
    );
    const dist = p5.Vector.dist(this.gemCenters[0], this.gemCenters[1]) * 0.5;

    if (dist > this.lineWidth * 3) {
      const gemCenterX = this.gemCenters[0].x + cos(angle) * dist;
      const gemCenterY = this.gemCenters[0].y + sin(angle) * dist;
      this.gemCenters.push(createVector(gemCenterX, gemCenterY));
    }

    this.makeGemPoints(this.gemCenters);

    this.turningGems = [false, false];
    this.turnAngle = [random(PI), random(PI)];
  }

  turnGems() {
    this.turningGems = this.turningGems.map((turning, i) => {
      if (turning) {
        this.turnAngle[i] += PI * 0.05;
        if (random() < 0.05) return false;
      } else {
        if (random() < .004) return true;
      }
      return turning;
    });
  }

  getNoise({ p, i, rangeMult = 4, off = 0 }) {
    const noiseMult = 0.0005;

    let range = this.lineWidth * rangeMult * this.noiseRangeMult;

    const smallOff = off + (millis() + i * 0.01) * 0.00005 + i;

    const smallNoise = map(
      noise(p.x * noiseMult + smallOff, p.y * noiseMult + smallOff),
      0,
      1,
      -range,
      range
    );
    return smallNoise;
  }

  draw(mainCnv) {
    this.turnGems()
    const getRange = (i) => {

      if (i > 10) return 5;
      return map(i, 0, 10, 0, 5);
    };
    mainCnv.fill("white");
    mainCnv.strokeWeight(this.strokeW * 0.75);
    mainCnv.stroke("black");
    this.gemPoints.forEach((p, i) => {
      const center = getCentroid(p);
      mainCnv.push();
      mainCnv.translate(this.gemCenters[i].x, this.gemCenters[i].y);
      mainCnv.rotate(this.turnAngle[i]);
      mainCnv.translate(-this.gemCenters[i].x, -this.gemCenters[i].y);
      this.drawCurvyPoly(mainCnv, p, 3, true, i);
      mainCnv.pop();
    });

    mainCnv.noFill();
    mainCnv.strokeWeight(this.strokeW * 1.5);
    mainCnv.stroke("black");
    mainCnv.beginShape();
    this.squigglePoints.forEach((p, i) => {
      mainCnv.curveVertex(
        p.x + this.getNoise({ p, i, rangeMult: getRange(i) }),
        p.y + this.getNoise({ p, i, off: 100, rangeMult: getRange(i) })
      );
    });
    mainCnv.endShape();

    mainCnv.strokeWeight(this.strokeW * 0.33);
    mainCnv.stroke("white");
    mainCnv.beginShape();
    this.squigglePoints.forEach((p, i) => {
      mainCnv.curveVertex(
        p.x + this.getNoise({ p, i, rangeMult: getRange(i) }),
        p.y + this.getNoise({ p, i, off: 100, rangeMult: getRange(i) })
      );
    });
    mainCnv.endShape();

    mainCnv.fill("white");
    mainCnv.strokeWeight(this.strokeW * 1);
    mainCnv.stroke("black");
    this.drawPetals(mainCnv);
  }

  squiggle(xInd, yInd) {
    const p = this.internalPoints[yInd][xInd];

    const gRange = this.lineWidth * 0.2;
    p.x += randomGaussian(0, gRange);
    p.y += randomGaussian(0, gRange);

    this.squigglePoints.push(p);

    let nextX, nextY;
    let valid = false;

    while (!valid && this.attempts < 100) {
      nextX = xInd + round(random(-1, 1)); //is long ways in the line
      nextY = yInd + round(random(-1, 1));
      valid = true;

      if (nextX < 0) nextX = 0;
      if (nextY < 0) nextY = 0;
      if (nextX >= this.internalPoints[0].length)
        nextX = this.internalPoints[0].length - 1;
      if (nextY >= this.internalPoints.length)
        nextY = this.internalPoints.length - 1;

      if (nextY >= this.internalPoints.length) valid = false;
      if (nextY === yInd && nextX === xInd) nextX++;
      this.attempts++;
    }

    if (!valid) return;
    if (nextX >= this.internalPoints[0].length) return;

    this.attempts = 0;

    this.squiggle(nextX, nextY);
  }

  makePetals(sides = 5) {
    const startingAngle = random(TWO_PI);
    const angle = TWO_PI / sides;

    const petalRadius = this.lineWidth * 3.5;
    const petalSides = 10;
    const petalNoiseRange = this.lineWidth * 1.25

    for (let a = 0; a < TWO_PI; a += angle) {
      const dist = this.lineWidth * 4;

      const sx = this.focalPoint.x + cos(a + startingAngle) * dist;
      const sy = this.focalPoint.y + sin(a + startingAngle) * dist;
      const points = makeCurvyPoly(
        sx,
        sy,
        petalRadius,
        petalSides,
        undefined,
        petalNoiseRange
      );
      this.petalPoints.push(points);
    }
  }

  drawPetals(mainCnv) {
    this.petalPoints.forEach((p, i) => {
      this.drawCurvyPoly(mainCnv, p);
    });
  }

  makeGemPoints(leafCenters) {
    leafCenters.forEach((p) => {
      

      let x = p.x;
 
      const distFromCenter = p5.Vector.dist(createVector(x, p.y), this.focalPoint);
      const sizeMult = map(distFromCenter, 0, this.boxHeight / 2, 0.5, 3);

      const points = makeCurvyPoly(x, p.y, sizeMult * this.lineWidth, this.shapeSides);
      this.gemPoints.push(points);
    });
  }

  drawCurvyPoly(cnv, petals, rangeMult = 5, noCurve = false, idx) {
    const pointsWithNoise = [];
    cnv.beginShape();
    petals.forEach((p, i) => {
      const indx = this.squigglePoints.length; //should be the same as the last point in the line
      const x = p.x + this.getNoise({ p, i: indx, off: 200, rangeMult });
      const y = p.y + this.getNoise({ p, i: indx, off: 300, rangeMult });
      if (noCurve) {
        cnv.vertex(x,y);
      } else {
        cnv.curveVertex(x,y );
      }
      pointsWithNoise.push(createVector(x, y));
    });
    cnv.endShape();

    this.gemCenters[idx] = getCentroid(pointsWithNoise);
  }
}