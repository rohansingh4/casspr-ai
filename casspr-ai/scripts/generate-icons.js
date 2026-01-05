#!/usr/bin/env node

/**
 * Casspr Extension - Icon Generator
 * Generates PNG icons matching the cassprAIR logo style
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [16, 48, 128];
const ICONS_DIR = path.join(__dirname, '..', 'icons');

// Create the Casspr "C" icon - wide opening on right like cassprAIR
function createIconSVG(size) {
  const center = size / 2;
  const radius = size * 0.265;
  const strokeWidth = Math.max(2, size * 0.062);
  const cornerRadius = size * 0.22;

  // Wide opening on right (about 75-80 degrees gap)
  const gapAngle = 78;
  const startAngle = gapAngle / 2;
  const endAngle = 360 - gapAngle / 2;

  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;

  const startX = center + radius * Math.cos(startRad);
  const startY = center + radius * Math.sin(startRad);
  const endX = center + radius * Math.cos(endRad);
  const endY = center + radius * Math.sin(endRad);

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF"/>
      <stop offset="100%" style="stop-color:#E8E8E8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#000000"/>
  <path d="M ${startX.toFixed(2)} ${startY.toFixed(2)} A ${radius} ${radius} 0 1 0 ${endX.toFixed(2)} ${endY.toFixed(2)}"
    fill="none" stroke="url(#g)" stroke-width="${strokeWidth}" stroke-linecap="round"/>
</svg>`;
}

function createSimpleIconSVG(size) {
  const center = size / 2;
  const radius = size * 0.28;
  const strokeWidth = Math.max(1.5, size * 0.1);
  const cornerRadius = size * 0.2;

  const gapAngle = 80;
  const startRad = ((gapAngle / 2) - 90) * Math.PI / 180;
  const endRad = ((360 - gapAngle / 2) - 90) * Math.PI / 180;

  const startX = center + radius * Math.cos(startRad);
  const startY = center + radius * Math.sin(startRad);
  const endX = center + radius * Math.cos(endRad);
  const endY = center + radius * Math.sin(endRad);

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#000"/>
  <path d="M ${startX.toFixed(2)} ${startY.toFixed(2)} A ${radius} ${radius} 0 1 0 ${endX.toFixed(2)} ${endY.toFixed(2)}"
    fill="none" stroke="#FFF" stroke-width="${strokeWidth}" stroke-linecap="round"/>
</svg>`;
}

async function generateIcons() {
  console.log('Generating Casspr icons...\n');

  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  for (const size of ICON_SIZES) {
    const svg = size <= 16 ? createSimpleIconSVG(size) : createIconSVG(size);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(ICONS_DIR, `icon${size}.png`));
    console.log(`  ✓ icon${size}.png`);
  }

  console.log('\n✓ Done!');
}

generateIcons().catch(e => { console.error(e); process.exit(1); });
