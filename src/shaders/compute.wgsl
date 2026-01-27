struct Pointer {
  x: f32,
  y: f32,
  pressure: f32,
  down: u32,
}

struct Brush {
  radius: f32,
  hardness: f32,
  noise: f32,
  color: vec4<f32>,
}

struct Wind {
  angle: f32,
  speed: f32,
  diffusion: f32,
}

struct Size {
  width: u32,
  height: u32,
}

@group(0) @binding(0) var pigmentInput: texture_2d<f32>;
@group(0) @binding(1) var pigmentOutput: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var waterInput: texture_2d<f32>;
@group(0) @binding(3) var waterOutput: texture_storage_2d<rgba8unorm, write>;

@group(1) @binding(0) var<uniform> pointer: Pointer;
@group(1) @binding(1) var<uniform> brush: Brush;
@group(1) @binding(2) var<uniform> wind: Wind;
@group(1) @binding(3) var<uniform> size: Size;

fn srgbToLinear(color: vec3<f32>) -> vec3<f32> {
  return pow(color, vec3<f32>(2.2));
}

fn linearToSrgb(color: vec3<f32>) -> vec3<f32> {
  return pow(color, vec3<f32>(1.0 / 2.2));
}

fn rand(position: vec2<f32>) -> f32 {
  return fract(sin(dot(position, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

fn noise2(position: vec2<f32>) -> f32 {
  let cell = floor(position);
  let localCoord = fract(position);

  let topLeft = rand(cell);
  let topRight = rand(cell + vec2<f32>(1.0, 0.0));
  let bottomLeft = rand(cell + vec2<f32>(0.0, 1.0));
  let bottomRight = rand(cell + vec2<f32>(1.0, 1.0));

  let blendFactor = localCoord * localCoord * (3.0 - 2.0 * localCoord);
  let mixTop = mix(topLeft, topRight, blendFactor.x);
  let mixBottom = mix(bottomLeft, bottomRight, blendFactor.x);
  let result = mix(mixTop, mixBottom, blendFactor.y);

  return result;
}

fn fbm(position: vec2<f32>) -> f32 {
  var p = position;
  var value: f32 = 0.0;
  var amplitude: f32 = 0.5;
  let shift = vec2<f32>(100.0);

  for (var i: i32 = 0; i < 4; i = i + 1) {
    value = value + amplitude * noise2(p);
    p = p * 2.0 + shift;
    amplitude = amplitude * 0.5;
  }

  return value;
}

@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) gid: vec3<u32>) {
  let pixelX = gid.x;
  let pixelY = gid.y;

  if (pixelX >= size.width || pixelY >= size.height) {
    return;
  }

  let uv = vec2<i32>(i32(pixelX), i32(pixelY));
  var pigment = srgbToLinear(textureLoad(pigmentInput, uv, 0).rgb);
  var water = srgbToLinear(textureLoad(waterInput, uv, 0).rgb);

  if (pointer.down == 1u) {
    let deltaX = f32(pixelX) - pointer.x;
    let deltaY = f32(pixelY) - pointer.y;
    let distance = sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < brush.radius) {
      let edgeFactor = 1.0 - smoothstep(
        brush.radius * brush.hardness,
        brush.radius,
        distance
      );

      let pressure = clamp(pointer.pressure, 0.1, 1.0);
      let fbmValue = fbm(vec2<f32>(f32(pixelX), f32(pixelY)) * 0.02);
      let noiseOffset = (fbmValue - 0.5) * brush.noise;
      let density = clamp((edgeFactor * pressure + noiseOffset) * brush.color.a, 0.0, 1.0);

      let hueShift = vec3<f32>(
        fbmValue * 0.04,
        -fbmValue * 0.02,
        fbmValue * 0.03
      );

      let brushColorLinear = clamp(
        srgbToLinear(brush.color.rgb) + hueShift,
        vec3<f32>(0.0),
        vec3<f32>(1.0)
      );

      pigment = mix(pigment, brushColorLinear, density);
    }
  }

  var sumPigment: vec3<f32> = vec3<f32>(0.0);
  var sumWater: vec3<f32> = vec3<f32>(0.0);
  var totalWeight: f32 = 0.0;

  let kernelRadius = 8;
  let sigma = f32(kernelRadius) / 2.0;
  let windX = cos(wind.angle) * wind.speed;
  let windY = sin(wind.angle) * wind.speed;

  for (var offsetX: i32 = -kernelRadius; offsetX <= kernelRadius; offsetX = offsetX + 1) {
    for (var offsetY: i32 = -kernelRadius; offsetY <= kernelRadius; offsetY = offsetY + 1) {
      let neighborX = i32(pixelX) + offsetX;
      let neighborY = i32(pixelY) + offsetY;

      if (neighborX < 0 || neighborX >= i32(size.width) ||
          neighborY < 0 || neighborY >= i32(size.height)) {
        continue;
      }

      let distanceToNeighbor = sqrt(f32(offsetX * offsetX + offsetY * offsetY));
      var weight = exp(-(distanceToNeighbor * distanceToNeighbor) / (2.0 * sigma * sigma));

      let neighborNoise = fbm(vec2<f32>(f32(neighborX), f32(neighborY)) * 0.02);
      let turbulence = (neighborNoise - 0.5) * brush.noise;

      weight = weight * (1.0 + f32(offsetX) * windX / 8.0 + f32(offsetY) * windY / 8.0 + turbulence);

      let pigmentSample = srgbToLinear(textureLoad(pigmentInput, vec2<i32>(neighborX, neighborY), 0).rgb);
      let waterSample = srgbToLinear(textureLoad(waterInput, vec2<i32>(neighborX, neighborY), 0).rgb);

      sumPigment = sumPigment + pigmentSample * weight;
      sumWater = sumWater + waterSample * weight;
      totalWeight = totalWeight + weight;
    }
  }

  let diffusedPigment = mix(pigment, sumPigment / totalWeight, wind.diffusion);
  let diffusedWater = mix(water, sumWater / totalWeight, wind.diffusion);

  let finalPigment = clamp(diffusedPigment, vec3<f32>(0.0), vec3<f32>(1.0));
  let finalWater = clamp(diffusedWater * 0.995, vec3<f32>(0.0), vec3<f32>(1.0));

  textureStore(pigmentOutput, uv, vec4<f32>(linearToSrgb(finalPigment), 1.0));
  textureStore(waterOutput, uv, vec4<f32>(linearToSrgb(finalWater), 1.0));
}
