export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // Set canvas size to match the bounding box
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Calculate source and destination coordinates
  let sx = pixelCrop.x;
  let sy = pixelCrop.y;
  let sWidth = pixelCrop.width;
  let sHeight = pixelCrop.height;
  let dx = 0;
  let dy = 0;
  let dWidth = pixelCrop.width;
  let dHeight = pixelCrop.height;

  // If crop area goes outside the image, adjust coordinates
  if (sx < 0) {
    dx = Math.abs(sx);
    sWidth += sx;
    dWidth += sx;
    sx = 0;
  }
  if (sy < 0) {
    dy = Math.abs(sy);
    sHeight += sy;
    dHeight += sy;
    sy = 0;
  }
  if (sx + sWidth > image.width) {
    const overflow = (sx + sWidth) - image.width;
    sWidth -= overflow;
    dWidth -= overflow;
  }
  if (sy + sHeight > image.height) {
    const overflow = (sy + sHeight) - image.height;
    sHeight -= overflow;
    dHeight -= overflow;
  }

  // Only draw if there's something to draw
  if (sWidth > 0 && sHeight > 0) {
    ctx.drawImage(
      image,
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      dWidth,
      dHeight
    );
  }

  // Return as base64 string
  return canvas.toDataURL('image/png');
}
