const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const dir = path.join(__dirname, 'public/assets');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

const results = {};

files.forEach(file => {
  const data = fs.readFileSync(path.join(dir, file));
  const png = PNG.sync.read(data);
  let minX = png.width, minY = png.height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const alpha = png.data[idx + 3];
      if (alpha > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const w = maxX - minX;
  const h = maxY - minY;
  const cx = minX + w/2;
  const cy = minY + h/2;
  
  results[file] = {
    canvasW: png.width,
    canvasH: png.height,
    cropW: w,
    cropH: h,
    cropRatio: png.width / w, // how much we have to multiply visual size to get canvas size
    cropCenterX: cx,
    cropCenterY: cy,
    xOffsetRatio: (cx - png.width/2)/png.width, // offset relative to canvas
    yOffsetRatio: (cy - png.height/2)/png.height,
  };
});

console.log(JSON.stringify(results, null, 2));
