#!/usr/bin/env node

/**
 * Casspr Extension - Icon Generator
 * Generates PNG icons from source logo
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [16, 48, 128];
const ICONS_DIR = path.join(__dirname, '..', 'icons');
const SOURCE_LOGO = path.join(__dirname, '..', 'assets', 'logo-source.png');

async function generateIcons() {
  console.log('Generating Casspr icons...\n');

  // Check if source logo exists
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('Error: Source logo not found at assets/logo-source.png');
    console.error('Please save the Casspr logo PNG to that location first.');
    process.exit(1);
  }

  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  for (const size of ICON_SIZES) {
    const cornerRadius = Math.round(size * 0.22); // ~22% corner radius

    // Create rounded rectangle mask
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}">
        <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
      </svg>`
    );

    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'cover' })
      .composite([{
        input: mask,
        blend: 'dest-in'
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(ICONS_DIR, `icon${size}.png`));

    console.log(`  ✓ icon${size}.png`);
  }

  console.log('\n✓ Done!');
}

generateIcons().catch(e => { console.error(e); process.exit(1); });
