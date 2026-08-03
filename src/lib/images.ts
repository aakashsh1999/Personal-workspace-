const MAX_EDGE = 1280;
const MAX_BYTES = 450_000;

/** Compress an image file/blob to a JPEG data URL suitable for note storage. */
export async function compressImage(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please drop or paste an image file.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > MAX_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > MAX_BYTES * 1.4) {
    throw new Error('Image is too large even after compression. Try a smaller one.');
  }

  return dataUrl;
}
