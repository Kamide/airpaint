import computeShaderCode from "@/shaders/compute.wgsl";
import renderShaderCode from "@/shaders/render.wgsl";

import type { Store } from "@tanstack/react-store";

export type World = {
  pointer: Store<{
    x: number;
    y: number;
    pressure: number;
    down: boolean;
  }>;
  brush: Store<{
    radius: number;
    hardness: number;
    noise: number;
    color: { r: number; g: number; b: number; a: number };
  }>;
  wind: Store<{
    angle: number;
    speed: number;
    diffusion: number;
  }>;
  size: Store<{
    width: number;
    height: number;
  }>;
};

export type Props = {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
  world: World;
};

type Bit = 0 | 1;
type Command = (encoder: GPUCommandEncoder) => void;
type Dispose = () => void;

type Self = Props & {
  bit: Bit;
  command: Command[];
  dispose: Dispose[];
  rect: DOMRectReadOnly;
};

export function airpaint(props: Props): Dispose {
  const self: Self = {
    ...props,
    bit: 0,
    command: [],
    dispose: [],
    rect: props.canvas.getBoundingClientRect(),
  };

  initContext(self);
  initResizer(self);
  initEventListeners(self);

  const textures = initTextures(self);
  const buffers = initBuffers(self);

  initRender(self, textures);
  initCompute(self, textures, buffers);
  initAnimation(self);

  return () => {
    for (let i = self.dispose.length - 1; i >= 0; i--) {
      self.dispose[i]();
    }
  };
}

function initContext(self: Self): void {
  self.context.configure({
    alphaMode: "premultiplied",
    colorSpace: "srgb",
    device: self.device,
    format: self.format,
  });

  self.dispose.push(() => {
    self.context.unconfigure();
  });
}

function initResizer(self: Self): void {
  const resizer = new ResizeObserver((entries) => {
    const rect = entries[0].contentRect;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    self.rect = rect;
    self.canvas.width = width;
    self.canvas.height = height;
    self.world.size.setState({ width, height });
  });

  self.dispose.push(() => {
    resizer.disconnect();
  });

  resizer.observe(self.canvas);
}

function initEventListeners(self: Self): void {
  const { canvas, world } = self;

  const onPointerDown = (event: PointerEvent): void => {
    canvas.setPointerCapture(event.pointerId);
    onPointerMove(event);
    world.pointer.setState((state) => ({ ...state, down: true }));
  };

  const onPointerMove = (event: PointerEvent): void => {
    const x =
      ((event.clientX - self.rect.left) / self.rect.width) * canvas.width;
    const y =
      ((event.clientY - self.rect.top) / self.rect.height) * canvas.height;
    const pressure = event.pressure;
    world.pointer.setState((state) => ({ ...state, x, y, pressure }));
  };

  const onPointerUp = (event: PointerEvent): void => {
    canvas.releasePointerCapture(event.pointerId);
    world.pointer.setState((state) => ({ ...state, down: false }));
  };

  const onPointerLeave = (): void => {
    world.pointer.setState((state) => ({ ...state, down: false }));
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);

  self.dispose.push(() => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointerleave", onPointerLeave);
  });
}

function initTextures(self: Self) {
  let data = new Uint8Array(self.canvas.width * self.canvas.height * 4);

  const createTexture = (): GPUTexture => {
    const texture = self.device.createTexture({
      size: [self.canvas.width, self.canvas.height],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.COPY_SRC,
    });

    self.device.queue.writeTexture(
      { texture: texture },
      data,
      { bytesPerRow: self.canvas.width * 4 },
      [self.canvas.width, self.canvas.height],
    );

    return texture;
  };

  const pigment = [createTexture(), createTexture()];
  const water = [createTexture(), createTexture()];

  self.dispose.push(
    self.world.size.subscribe(() => {
      data = new Uint8Array(self.canvas.width * self.canvas.height * 4);
      for (const texture of [pigment, water]) {
        for (let i = 0; i < 2; i++) {
          texture[i].destroy();
          texture[i] = createTexture();
        }
      }
    }),
  );

  return { pigment, water };
}

function initBuffers(self: Self) {
  let label = 0;

  const createBuffer = <Data extends GPUAllowSharedBufferSource, State>(
    data: Data,
    store: Store<State>,
    update: (data: Data, state: State) => void,
  ): GPUBuffer => {
    const buffer = self.device.createBuffer({
      size: data.byteLength,
      label: String(label++),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const listener = () => {
      update(data, store.state);
      self.device.queue.writeBuffer(buffer, 0, data);
    };

    listener();
    self.dispose.push(store.subscribe(listener));
    return buffer;
  };

  const pointer = createBuffer(
    new DataView(new ArrayBuffer(16)),
    self.world.pointer,
    (data, state) => {
      data.setFloat32(0, state.x, true);
      data.setFloat32(4, state.y, true);
      data.setFloat32(8, state.pressure, true);
      data.setUint32(12, state.down ? 1 : 0, true);
    },
  );

  const brush = createBuffer(
    new Float32Array(8),
    self.world.brush,
    (data, state) => {
      data[0] = state.radius;
      data[1] = state.hardness;
      data[2] = state.noise;
      data[4] = state.color.r;
      data[5] = state.color.g;
      data[6] = state.color.b;
      data[7] = state.color.a;
    },
  );

  const wind = createBuffer(
    new Float32Array(3),
    self.world.wind,
    (data, state) => {
      data[0] = state.angle;
      data[1] = state.speed;
      data[2] = state.diffusion;
    },
  );

  const size = createBuffer(
    new Uint32Array(2),
    self.world.size,
    (data, state) => {
      data[0] = state.width;
      data[1] = state.height;
    },
  );

  return { pointer, brush, wind, size };
}

function initRender(
  self: Self,
  textures: ReturnType<typeof initTextures>,
): void {
  const sampler = self.device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  const module = self.device.createShaderModule({ code: renderShaderCode });

  const pipeline = self.device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vertexMain" },
    fragment: {
      module,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: self.format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
          writeMask: GPUColorWrite.ALL,
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  });

  self.command.push((encoder) => {
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: self.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    pass.setPipeline(pipeline);

    const bindGroup = self.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: textures.pigment[self.bit].createView() },
        { binding: 1, resource: sampler },
      ],
    });

    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
  });
}

function initCompute(
  self: Self,
  textures: ReturnType<typeof initTextures>,
  buffers: ReturnType<typeof initBuffers>,
): void {
  const module = self.device.createShaderModule({ code: computeShaderCode });

  const pipeline = self.device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "computeMain" },
  });

  self.command.push((encoder) => {
    const pass = encoder.beginComputePass();

    pass.setPipeline(pipeline);

    const pigmentIn = textures.pigment[self.bit];
    const pigmentOut = textures.pigment[self.bit ^ 1];
    const waterIn = textures.water[self.bit];
    const waterOut = textures.water[self.bit ^ 1];

    pass.setBindGroup(
      0,
      self.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: pigmentIn.createView() },
          { binding: 1, resource: pigmentOut.createView() },
          { binding: 2, resource: waterIn.createView() },
          { binding: 3, resource: waterOut.createView() },
        ],
      }),
    );

    pass.setBindGroup(
      1,
      self.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(1),
        entries: [
          { binding: 0, resource: buffers.pointer },
          { binding: 1, resource: buffers.brush },
          { binding: 2, resource: buffers.wind },
          { binding: 3, resource: buffers.size },
        ],
      }),
    );

    pass.dispatchWorkgroups(
      Math.ceil(self.canvas.width / 16),
      Math.ceil(self.canvas.height / 16),
    );

    pass.end();
  });
}

function initAnimation(self: Self): void {
  const frame = () => {
    const encoder = self.device.createCommandEncoder();

    for (let i = self.command.length - 1; i >= 0; i--) {
      self.command[i](encoder);
    }

    self.device.queue.submit([encoder.finish()]);
    self.bit = (self.bit ^ 1) as Bit;
    raf = requestAnimationFrame(frame);
  };

  let raf = requestAnimationFrame(frame);

  self.dispose.push(() => {
    cancelAnimationFrame(raf);
  });
}
