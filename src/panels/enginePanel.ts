// import assert from 'assert';
import { type EnginePanelConfig } from '../config/mainConfig';
import { type Stats } from '../ui/stats/stats';
import { Panel } from './panel';
import { EnginePanelGui } from './enginePanelGui';
import { EnginePanelInputKeyCodeEnum } from './enginePanelTypes';

class EnginePanel extends Panel {
  protected menuGui: EnginePanelGui;

  init(config: EnginePanelConfig, stats: Stats): void {
    super.init(config, stats);
    this.initInput();
  }

  private initInput(): void {
    this.inputKeys = new Set(Object.values(EnginePanelInputKeyCodeEnum));
  }

  get config(): EnginePanelConfig {
    return super.config as EnginePanelConfig;
  }

  protected createPanelGui(): EnginePanelGui {
    return new EnginePanelGui();
  }

  get MenuGui(): EnginePanelGui {
    return this.menuGui;
  }

  // protected destroy(): void {
  //   super.destroy();
  // }
}

export { EnginePanel };
