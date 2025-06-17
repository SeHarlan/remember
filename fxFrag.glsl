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

  st = stZoom(st, 1. - strength * 0.1);

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

  // color.rgb = contrast(color.rgb, 1.15);
  // color.rgb = saturation(color.rgb, 1.3);
  color.rgb = contrast(color.rgb, 1.25);
  color.rgb = saturation(color.rgb, 1.4);

  //grayscale
  if(useGrayScale ) {
    color.rgb = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114))); //retro
  }

  //static
  vec4 preColor = color;

  float staticDirection = randomNegPos(st * stMod + fract(u_time * 0.001) + 100.);
  color.rgb += random(st * stMod + fract(u_time * 0.001)) * staticMod * staticDirection;

  //vignette effect
  float distFromCenter = distance(st, vec2(.5));
  color.rgb += smoothstep(.8, -1.1, distFromCenter); //light center
  color.rgb *= smoothstep(.725, .5, distFromCenter); //corners

  float borderWidth = .01;

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

  color.rgb = mix(color.rgb, preColor.rgb, 0.225);







  gl_FragColor = color;
}



