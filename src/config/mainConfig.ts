import { panelConfig } from './panelConfig';
import { enginePanelConfig } from './enginePanelConfig';
import { viewPanelConfig } from './viewPanelConfig';
import {
  startOffset,
  initialMemoryPages,
  maximumMemoryPages,
  // memoryBase,
} from '../engine/wasmEngine/wasm/wasmConfig.mjs';

const mainConfig = {
  numAuxWorkers: 0,

  wasmMemStartOffset: startOffset,
  wasmMemStartPages: initialMemoryPages,
  wasmMemMaxPages: maximumMemoryPages,

  wasmWorkerHeapPages: 1,
  // 0 -> it can expand freely after the previous mem regions
  // TODO case != 0 not supported for now
  wasmSharedHeapSize: 0,

  // targetRPS: 60,
  targetUPS: 80,

  multiplier: 1,

  panelConfig,
  enginePanelConfig,
  viewPanelConfig,
};

type Config = typeof mainConfig;

export { mainConfig };
export { StartViewMode } from './panelConfig';

export type { Config };
export type { PanelConfig } from './panelConfig';
export type { EnginePanelConfig } from './enginePanelConfig';
export type { ViewPanelConfig } from './viewPanelConfig';
export type { EventLogConfig } from './eventLogConfig';
export type { ConsoleConfig } from './consoleConfig';
