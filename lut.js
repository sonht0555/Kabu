/**
 * Script tạo LUT (Look-Up Table) offline cho Kabu
 * Chạy script này một lần để tạo file LUT, sau đó sử dụng trong game
 */

const fs = require('fs');
const path = require('path');

// Cấu hình cho các hệ thống
const systems = {
  gbc: {
    width: 160,
    height: 144,
    stride: 256
  },
  gba: {
    width: 240,
    height: 160,
    stride: 240
  }
};

/**
 * Tạo LUT cho vị trí index
 * @param {string} system - Hệ thống (gbc hoặc gba)
 * @returns {Int32Array} - Mảng chứa các cặp srcIndex và destIndex
 */
function createIndexLUT(system) {
  const { width, height, stride } = systems[system];
  const lut = new Int32Array(width * height * 2);
  let index = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      lut[index++] = y * stride + x;      // srcIndex
      lut[index++] = (y * width + x) * 4; // destIndex
    }
  }

  return lut;
}

/**
 * Lưu LUT vào file
 * @param {string} system - Hệ thống (gbc hoặc gba)
 */
function saveLUT(system) {
  const lut = createIndexLUT(system);
  const buffer = Buffer.from(lut.buffer);
  
  // Tạo thư mục nếu chưa tồn tại
  const dirPath = path.join(__dirname, '..', 'lut');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, `index_lut_${system}.bin`);
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Đã tạo LUT cho ${system}: ${filePath}`);
  console.log(`Kích thước: ${buffer.length} bytes`);
}

// Tạo LUT cho cả hai hệ thống
saveLUT('gbc');
saveLUT('gba');

console.log('Hoàn tất tạo LUT!');
