import { StatsPanel } from './statsPanel';
import { StatsEnum } from './stats';

// TODO not used
// const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

// TODO not used
// function bytesToSize(bytes: number, nFractDigit: number){
//   if (bytes === 0) return 'n/a';
//   nFractDigit	= nFractDigit !== undefined ? nFractDigit : 0;
//   const precision = Math.pow(10, nFractDigit);
//   const i = Math.floor(Math.log(bytes) / Math.log(1024));
//   return Math.round(bytes*precision / Math.pow(1024, i))/precision + ' ' + sizes[i];
// }

const ONE_MB = 1_048_576;

class MemoryStatsPanel extends StatsPanel {
  constructor() {
    super({
      id: StatsEnum.MEM,
      title: 'MEM',
      fg: '#FF0',
      bg: '#220',
      graphHeight: 100,
    });
  }

  update(numBytes: number): void {
    super.update(numBytes / ONE_MB);
  }
}

export { MemoryStatsPanel };
