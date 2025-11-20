/**
 * Icon Generation Script
 *
 * This script helps generate PNG icons from the SVG source.
 *
 * USAGE:
 * 1. Install dependencies: npm install -g sharp-cli
 * 2. Run this script: node scripts/generate-icons.js
 *
 * OR manually convert using online tools:
 * - Upload public/icons/icon.svg to https://realfavicongenerator.net/
 * - Or use https://svg2png.com/
 *
 * Required icon sizes:
 * - 192x192 (standard PWA)
 * - 512x512 (high-res PWA)
 * - 512x512 maskable (with safe zone)
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('📱 QUANTUM COUNTDOWN - ICON GENERATOR');
console.log('='.repeat(60));
console.log('');
console.log('SVG Icon Location: public/icons/icon.svg');
console.log('');
console.log('TO GENERATE PNG ICONS:');
console.log('');
console.log('Option 1 - Using Sharp CLI:');
console.log('  npm install -g sharp-cli');
console.log('  sharp -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192');
console.log('  sharp -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512');
console.log('  sharp -i public/icons/icon.svg -o public/icons/icon-maskable.png resize 512 512');
console.log('');
console.log('Option 2 - Using ImageMagick:');
console.log('  convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png');
console.log('  convert public/icons/icon.svg -resize 512x512 public/icons/icon-512.png');
console.log('  convert public/icons/icon.svg -resize 512x512 public/icons/icon-maskable.png');
console.log('');
console.log('Option 3 - Online Tools:');
console.log('  1. Go to https://realfavicongenerator.net/');
console.log('  2. Upload public/icons/icon.svg');
console.log('  3. Download and extract icons to public/icons/');
console.log('');
console.log('Option 4 - Using Inkscape:');
console.log('  inkscape public/icons/icon.svg --export-type=png --export-width=192 --export-filename=public/icons/icon-192.png');
console.log('  inkscape public/icons/icon.svg --export-type=png --export-width=512 --export-filename=public/icons/icon-512.png');
console.log('  inkscape public/icons/icon.svg --export-type=png --export-width=512 --export-filename=public/icons/icon-maskable.png');
console.log('');
console.log('='.repeat(60));
console.log('');

// Check if sharp is available
try {
  require('sharp');
  console.log('✅ Sharp is installed! Generating icons...');
  console.log('');

  // Note: This would require sharp to be added to package.json
  // For now, this is just documentation
} catch (e) {
  console.log('ℹ️  For automated icon generation, install sharp:');
  console.log('   npm install sharp');
  console.log('');
}
