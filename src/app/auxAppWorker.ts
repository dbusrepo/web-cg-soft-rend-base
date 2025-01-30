import type { WasmViews } from '../engine/wasmEngine/wasmViews';
import type { WasmEngineModule } from '../engine/wasmEngine/wasmLoader';
import { buildWasmMemViews } from '../engine/wasmEngine/wasmViews';
import type { WasmRunParams } from '../engine/wasmEngine/wasmRun';
import { WasmRun } from '../engine/wasmEngine/wasmRun';
import {
  type FrameColorRGBAWasm,
  getFrameColorRGBAWasmView,
} from '../engine/wasmEngine/frameColorRgbaWasm';

const enum AuxAppWorkerCommandEnum {
  INIT = 'aux_app_worker_init',
  RUN = 'aux_app_worker_run',
}

interface AuxAppWorkerParams {
  workerIdx: number;
  numWorkers: number;
  wasmRunParams: WasmRunParams;
}

class AuxAppWorker {
  private params: AuxAppWorkerParams;
  private wasmRun: WasmRun;
  private wasmViews: WasmViews;
  private wasmEngineModule: WasmEngineModule;
  private frameColorRGBAWasm: FrameColorRGBAWasm;
  private frameBuf32: Uint32Array;
  private frameStrideBytes: number;

  async init(params: AuxAppWorkerParams): Promise<void> {
    const { workerIdx } = params;
    console.log(`Aux app worker ${workerIdx} initializing...`);
    this.params = params;
    await this.initWasmRun();
    this.frameColorRGBAWasm = getFrameColorRGBAWasmView(this.wasmEngineModule);
    this.initFrameBuf();
  }

  private async initWasmRun() {
    const { wasmRunParams } = this.params;
    this.wasmRun = new WasmRun();
    this.wasmViews = buildWasmMemViews(
      wasmRunParams.wasmMem,
      wasmRunParams.wasmMemRegionsOffsets,
      wasmRunParams.wasmMemRegionsSizes,
    );
    await this.wasmRun.init(wasmRunParams, this.wasmViews);
    this.wasmEngineModule = this.wasmRun.WasmModules.engine;
  }

  private initFrameBuf() {
    const { rgbaSurface0: frameBuf8 } = this.wasmViews;
    this.frameBuf32 = new Uint32Array(
      frameBuf8.buffer,
      0,
      frameBuf8.byteLength / Uint32Array.BYTES_PER_ELEMENT,
    );
    this.frameStrideBytes = this.wasmRun.FrameStrideBytes;
  }

  async run() {
    const { workerIdx } = this.params;
    console.log(`Aux app worker ${workerIdx} running`);
    const { wasmViews } = this;
    try {
      for (;;) {
        Atomics.wait(wasmViews.syncArr, workerIdx, 0);
        // this.wasmEngineModule.render();
        Atomics.store(wasmViews.syncArr, workerIdx, 0);
        Atomics.notify(wasmViews.syncArr, workerIdx);
      }
    } catch (error) {
      console.log(
        `Error while running aux app worker ${this.params.workerIdx}`,
      );
      console.error(error);
    }
  }
}

let auxAppWorker: AuxAppWorker;

const commands = {
  [AuxAppWorkerCommandEnum.INIT]: async (params: AuxAppWorkerParams) => {
    auxAppWorker = new AuxAppWorker();
    await auxAppWorker.init(params);
    postMessage({
      status: `Aux app worker ${params.workerIdx} init completed`,
    });
  },
  [AuxAppWorkerCommandEnum.RUN]: async () => {
    await auxAppWorker.run();
  },
};

// self.addEventListener('message', async ({ data: { command, params } }) => {
globalThis.onmessage = ({ data: { command, params } }) => {
  const commandKey = command as keyof typeof commands;
  if (commands.hasOwnProperty(commandKey)) {
    try {
      commands[commandKey](params) as unknown as void;
    } catch (error) {
      console.error(
        'error executing command in aux app worker message handler',
      );
      console.error(error);
    }
  }
};

interface AuxAppWorkerDesc {
  workerIdx: number;
  worker: Worker;
}

export type { AuxAppWorkerParams, AuxAppWorkerDesc };
export { AuxAppWorkerCommandEnum };
