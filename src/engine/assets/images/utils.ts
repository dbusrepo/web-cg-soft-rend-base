import assert from 'node:assert';
import { fileTypeFromBuffer } from 'file-type';
import { type ImageInfo } from './imageDecoder';
import { PngDecoderRGBA } from './vivaxy-png/PngDecoderRGBA';
import { BitImageRGBA, BPP_RGBA } from './bitImageRgba';

async function decodePNGs(
  imageBuffers: ArrayBuffer[],
): Promise<BitImageRGBA[]> {
  const pngDecoder = new PngDecoderRGBA();
  const images = await Promise.all(
    imageBuffers.map(async (imgBuffer) => {
      const fileType = await fileTypeFromBuffer(imgBuffer);
      if (!fileType) {
        throw new Error(`_getImagesInitData: file type not found`);
      }
      let imgInfo: ImageInfo;
      const image = new BitImageRGBA();
      switch (fileType.ext) {
        case 'png': {
          {
            imgInfo = pngDecoder.readInfo(imgBuffer);
            pngDecoder.read(imgBuffer, image);
            assert(imgInfo.bpp === BPP_RGBA);
          }
          break;
        }
        default: {
          throw new Error(
            `_loadImage does not support ${fileType.ext} loading`,
          );
        }
      }
      return image;
    }),
  );
  return images;
}

export { decodePNGs };
