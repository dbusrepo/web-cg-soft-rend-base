// import assert from 'assert';
import * as WasmUtils from './wasmMemUtils';
import type { WasmViews } from './wasmViews';
import { buildWasmMemViews } from './wasmViews';
import type { WasmModules, WasmImports } from './wasmLoader';
import { loadWasmModules } from './wasmLoader';
import { BPP_RGBA } from '../assets/images/bitImageRgba';
// import { randColor, sleep } from '../utils';
// import { BitImageRGBA } from './assets/images/bitImageRGBA';
// import { PngDecoderRGBA } from './assets/images/vivaxy-png/PngDecoderRGBA';
import {
  FONT_X_SIZE,
  FONT_Y_SIZE,
  FONT_SPACING,
} from '../../../assets/fonts/font';

type WasmRunParams = {
  // usePalette: boolean;
  wasmMem: WebAssembly.Memory;
  wasmMemRegionsSizes: WasmUtils.WasmMemRegionsData;
  wasmMemRegionsOffsets: WasmUtils.WasmMemRegionsData;
  wasmWorkerHeapSize: number;
  mainWorkerIdx: number;
  workerIdx: number;
  numWorkers: number;
  numTextures: number;
  surface0sizes: [number, number];
  surface1sizes: [number, number];
  frameColorRGBAPtr: number;
  texturesPtr: number;
  mipmapsPtr: number;
};

let gWasmRun: WasmRun;
let gWasmView: DataView;
let gWasmViews: WasmViews;

class WasmRun {
  protected params: WasmRunParams;
  protected wasmModules: WasmModules;
  protected wasmViews: WasmViews;

  public async init(params: WasmRunParams, wasmViews: WasmViews) {
    this.params = params;
    this.wasmViews = wasmViews;
    await this.loadWasmModules();
    gWasmRun = this;
    gWasmView = this.wasmViews.view;
    gWasmViews = this.wasmViews;
  }

  private buildWasmImports(): WasmImports {
    const {
      wasmMem: memory,
      wasmMemRegionsSizes: memSizes,
      wasmMemRegionsOffsets: memOffsets,
      wasmWorkerHeapSize: workerHeapSize,
      surface0sizes,
      // surface1sizes,
      mainWorkerIdx,
      numWorkers,
      numTextures,
      workerIdx,
      frameColorRGBAPtr,
      texturesPtr,
      mipmapsPtr,
    } = this.params;

    const logf = (f: number) =>
      console.log(`[wasm] Worker [${workerIdx}]: ${f}`);

    const logi = (i: number) => {
      console.log(`[wasm] Worker [${workerIdx}]: ${i}`);
    };

    const wasmImports: WasmImports = {
      memory,

      rgbaSurface0ptr: memOffsets[WasmUtils.MemRegionsEnum.RGBA_SURFACE_0],
      rgbaSurface0width: surface0sizes[0],
      rgbaSurface0height: surface0sizes[1],

      // rgbaSurface1ptr: memOffsets[WasmUtils.MemRegionsEnum.RGBA_SURFACE_1],
      // rgbaSurface1width: surface1sizes[0],
      // rgbaSurface1height: surface1sizes[1],

      syncArrayPtr: memOffsets[WasmUtils.MemRegionsEnum.SYNC_ARRAY],
      sleepArrayPtr: memOffsets[WasmUtils.MemRegionsEnum.SLEEP_ARRAY],
      mainWorkerIdx,
      workerIdx,
      numWorkers,
      workersHeapPtr: memOffsets[WasmUtils.MemRegionsEnum.WORKERS_HEAPS],
      workerHeapSize,
      sharedHeapPtr: memOffsets[WasmUtils.MemRegionsEnum.HEAP],
      // usePalette: this._config.usePalette ? 1 : 0,
      // usePalette: 0,
      fontCharsPtr: memOffsets[WasmUtils.MemRegionsEnum.FONT_CHARS],
      fontCharsSize: memSizes[WasmUtils.MemRegionsEnum.FONT_CHARS],
      numTextures,
      texturesIndexPtr: memOffsets[WasmUtils.MemRegionsEnum.TEXTURES_INDEX],
      texturesIndexSize: memSizes[WasmUtils.MemRegionsEnum.TEXTURES_INDEX],
      texelsPtr: memOffsets[WasmUtils.MemRegionsEnum.TEXTURES],
      texelsSize: memSizes[WasmUtils.MemRegionsEnum.TEXTURES],
      stringsDataPtr: memOffsets[WasmUtils.MemRegionsEnum.STRINGS],
      stringsDataSize: memSizes[WasmUtils.MemRegionsEnum.STRINGS],
      workersMemCountersPtr: memOffsets[WasmUtils.MemRegionsEnum.MEM_COUNTERS],
      workersMemCountersSize: memSizes[WasmUtils.MemRegionsEnum.MEM_COUNTERS],
      hrTimerPtr: memOffsets[WasmUtils.MemRegionsEnum.HR_TIMER],

      FONT_X_SIZE,
      FONT_Y_SIZE,
      FONT_SPACING,

      logi,
      logf,

      frameColorRGBAPtr,
      texturesPtr,
      mipmapsPtr,
    };

    return wasmImports;
  }

  private async loadWasmModules(): Promise<void> {
    const wasmImports = this.buildWasmImports();
    this.wasmModules = await loadWasmModules(wasmImports);
  }

  get FrameWidth(): number {
    return this.params.surface0sizes[0];
  }

  get FrameHeight(): number {
    return this.params.surface0sizes[1];
  }

  get FrameStride(): number {
    return this.FrameWidth;
  }

  get FrameStrideBytes(): number {
    return this.FrameWidth * BPP_RGBA;
  }

  get WasmViews(): WasmViews {
    return this.wasmViews;
  }

  get WasmModules(): WasmModules {
    return this.wasmModules;
  }

  get WasmMem(): WebAssembly.Memory {
    return this.params.wasmMem;
  }
}

export type { WasmRunParams };
export { WasmRun, gWasmRun, gWasmView, gWasmViews };
