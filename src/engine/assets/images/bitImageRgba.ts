// import assert from 'assert';
import { BitImage } from './bitImage';
import { BPP_RGBA, FrameColorRGBA } from '../../frameColorRgba';
import { isPowerOf2, nextPowerOf2 } from '../../utils';

class BitImageRGBA extends BitImage {
  private buf32: Uint32Array;
  private lg2Pitch: number; // lg2 of pitch pixels u32

  init(width: number, height: number, buf8: Uint8Array): void {
    this.width = width;
    this.height = height;
    this.Buf8 = buf8;
    // this.resizePitchPow2();
  }

  initLg2Pitch(
    width: number,
    height: number,
    lg2Pitch: number,
    buf8: Uint8Array,
  ): void {
    this.width = width;
    this.height = height;
    this.lg2Pitch = lg2Pitch;
    this.Buf8 = buf8;
    // assert(this.width <= 1 << this.lg2Pitch);
  }

  public resizePitchToPow2(): void {
    let pitch = this.width;
    if (!isPowerOf2(pitch)) {
      pitch = nextPowerOf2(pitch);
      const dstBuf8 = new Uint8Array(this.height * pitch * BPP_RGBA);
      let srcOffset = 0;
      let dstOffset = 0;
      const srcLineBytes = this.width * BPP_RGBA;
      const dstLineBytes = pitch * BPP_RGBA;
      for (let y = 0; y < this.height; ++y) {
        const srcRowY = this.buf8.subarray(srcOffset, srcOffset + srcLineBytes);
        dstBuf8.set(srcRowY, dstOffset);
        srcOffset += srcLineBytes;
        dstOffset += dstLineBytes;
      }
      this.Buf8 = dstBuf8;
    }
    this.lg2Pitch = Math.log2(pitch);
    // assert(this.width <= 1 << this.lg2Pitch);
  }

  get Lg2Pitch(): number {
    return this.lg2Pitch;
  }

  // required
  get Buf8(): Uint8Array {
    return this.buf8;
  }

  set Buf8(p: Uint8Array) {
    this.buf8 = p;
    this.buf32 = new Uint32Array(
      this.buf8.buffer,
      this.buf8.byteOffset,
      this.buf8.byteLength / BPP_RGBA,
    );
  }

  get Buf32(): Uint32Array {
    return this.buf32;
  }

  makeDarker(): void {
    const buf32 = this.Buf32;
    for (let i = 0; i < buf32.length; ++i) {
      // png texels are stored in rgba, read as abgr due to little endian
      const c = buf32[i]!; // abgr
      const a = (c >> 24) & 0xff;
      const b = (c >> 16) & 0xff;
      const g = (c >> 8) & 0xff;
      const r = c & 0xff;
      const r2 = (r * 3) >> 2;
      const g2 = (g * 3) >> 2;
      const b2 = (b * 3) >> 2;
      const a2 = a;
      // stored as abgr, bytes swapped by endian, read as abgr
      buf32[i] = FrameColorRGBA.colorABGR(a2, b2, g2, r2);
    }
  }
}

export { BPP_RGBA } from '../../frameColorRgba';
export { BitImageRGBA };
