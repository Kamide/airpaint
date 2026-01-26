@group(0) @binding(0) var baseTexture: texture_2d<f32>;
@group(0) @binding(1) var baseSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let positions = array<vec2<f32>, 6>(
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
  );

  let uvs = array<vec2<f32>, 6>(
    vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(0.0, 0.0),
    vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0)
  );

  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return textureSample(baseTexture, baseSampler, input.uv);
}
