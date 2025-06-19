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



