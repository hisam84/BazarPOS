const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read Icon.png
const srcIconPath = path.join(__dirname, '..', 'Icon.png');
const srcBuf = fs.readFileSync(srcIconPath);

// Decode PNG (512x512 RGBA)
function decodePNG(buf) {
  // Check PNG signature
  if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG');
  }

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  let idatBuffers = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressedData = Buffer.concat(idatBuffers);
  const rawData = zlib.inflateSync(compressedData);

  // Unfilter PNG scanlines (RGBA 8-bit)
  const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 4);
  const rowStride = 1 + width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4); // Standard RGBA output

  const prevRow = Buffer.alloc(width * bytesPerPixel);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    const filterType = rawData[rowOffset];
    const currentRow = rawData.subarray(rowOffset + 1, rowOffset + 1 + width * bytesPerPixel);

    // Apply inverse filter
    for (let i = 0; i < currentRow.length; i++) {
      const a = i >= bytesPerPixel ? currentRow[i - bytesPerPixel] : 0;
      const b = prevRow[i];
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;

      let val = currentRow[i];
      if (filterType === 1) { // Sub
        val = (val + a) & 0xff;
      } else if (filterType === 2) { // Up
        val = (val + b) & 0xff;
      } else if (filterType === 3) { // Average
        val = (val + Math.floor((a + b) / 2)) & 0xff;
      } else if (filterType === 4) { // Paeth
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (val + pr) & 0xff;
      }
      currentRow[i] = val;
    }

    currentRow.copy(prevRow);

    // Copy to standard RGBA buffer
    for (let x = 0; x < width; x++) {
      const srcIdx = x * bytesPerPixel;
      const dstIdx = (y * width + x) * 4;
      if (colorType === 6) { // RGBA
        pixels[dstIdx] = currentRow[srcIdx];
        pixels[dstIdx + 1] = currentRow[srcIdx + 1];
        pixels[dstIdx + 2] = currentRow[srcIdx + 2];
        pixels[dstIdx + 3] = currentRow[srcIdx + 3];
      } else if (colorType === 2) { // RGB
        pixels[dstIdx] = currentRow[srcIdx];
        pixels[dstIdx + 1] = currentRow[srcIdx + 1];
        pixels[dstIdx + 2] = currentRow[srcIdx + 2];
        pixels[dstIdx + 3] = 255;
      }
    }
  }

  return { width, height, pixels };
}

// Encode RGBA buffer to PNG
function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter 0
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * rowLength;
    rawData[rawOffset] = 0; // None filter
    const pixelOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rawOffset + 1, pixelOffset, pixelOffset + width * 4);
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buf = Buffer.alloc(8 + length + 4);
  buf.writeUInt32BE(length, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  buf.writeUInt32BE(crc >>> 0, 8 + length);
  return buf;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

// Bilinear Resize function
function resizeRGBA(srcWidth, srcHeight, srcPixels, dstWidth, dstHeight) {
  const dstPixels = Buffer.alloc(dstWidth * dstHeight * 4);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const gx = x * xRatio;
      const gy = y * yRatio;
      const gxi = Math.min(Math.floor(gx), srcWidth - 1);
      const gyi = Math.min(Math.floor(gy), srcHeight - 1);
      const gxiNext = Math.min(gxi + 1, srcWidth - 1);
      const gyiNext = Math.min(gyi + 1, srcHeight - 1);

      const xWeight = gx - gxi;
      const yWeight = gy - gyi;

      const idxTL = (gyi * srcWidth + gxi) * 4;
      const idxTR = (gyi * srcWidth + gxiNext) * 4;
      const idxBL = (gyiNext * srcWidth + gxi) * 4;
      const idxBR = (gyiNext * srcWidth + gxiNext) * 4;

      const dstIdx = (y * dstWidth + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = srcPixels[idxTL + c] * (1 - xWeight) + srcPixels[idxTR + c] * xWeight;
        const bottom = srcPixels[idxBL + c] * (1 - xWeight) + srcPixels[idxBR + c] * xWeight;
        dstPixels[dstIdx + c] = Math.round(top * (1 - yWeight) + bottom * yWeight);
      }
    }
  }
  return dstPixels;
}

// Create Maskable Icon with Theme Background and 75% Safe-Zone Scaling
function createMaskable(srcWidth, srcHeight, srcPixels, size, bgR, bgG, bgB) {
  const outPixels = Buffer.alloc(size * size * 4);

  // Fill background with Theme color
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    outPixels[idx] = bgR;
    outPixels[idx + 1] = bgG;
    outPixels[idx + 2] = bgB;
    outPixels[idx + 3] = 255;
  }

  // Scale icon to 75% size to be safely within Android mask circle
  const innerSize = Math.round(size * 0.76);
  const innerPixels = resizeRGBA(srcWidth, srcHeight, srcPixels, innerSize, innerSize);

  const startX = Math.round((size - innerSize) / 2);
  const startY = Math.round((size - innerSize) / 2);

  // Alpha blend inner icon onto background
  for (let y = 0; y < innerSize; y++) {
    for (let x = 0; x < innerSize; x++) {
      const srcIdx = (y * innerSize + x) * 4;
      const dstIdx = ((startY + y) * size + (startX + x)) * 4;

      const alpha = innerPixels[srcIdx + 3] / 255;
      if (alpha > 0) {
        outPixels[dstIdx] = Math.round(innerPixels[srcIdx] * alpha + outPixels[dstIdx] * (1 - alpha));
        outPixels[dstIdx + 1] = Math.round(innerPixels[srcIdx + 1] * alpha + outPixels[dstIdx + 1] * (1 - alpha));
        outPixels[dstIdx + 2] = Math.round(innerPixels[srcIdx + 2] * alpha + outPixels[dstIdx + 2] * (1 - alpha));
        outPixels[dstIdx + 3] = 255;
      }
    }
  }

  return outPixels;
}

// 1. Decode original Icon.png
const { width, height, pixels } = decodePNG(srcBuf);
console.log(`Decoded source Icon.png: ${width}x${height}`);

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 2. Standard Transparent PNG icons (512x512, 192x192, apple-touch-icon)
const png512 = encodePNG(512, 512, pixels);
const pixels192 = resizeRGBA(width, height, pixels, 192, 192);
const png192 = encodePNG(192, 192, pixels192);

fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'favicon.png'), png192);

// 3. Maskable Icons with theme background (#0f172a -> r:15, g:23, b:42) and safe zone scaling
const maskable512Pixels = createMaskable(width, height, pixels, 512, 15, 23, 42);
const maskable512Png = encodePNG(512, 512, maskable512Pixels);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), maskable512Png);

const maskable192Pixels = createMaskable(width, height, pixels, 192, 15, 23, 42);
const maskable192Png = encodePNG(192, 192, maskable192Pixels);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.png'), maskable192Png);

console.log('All high-resolution PNG & Maskable icons generated successfully!');
