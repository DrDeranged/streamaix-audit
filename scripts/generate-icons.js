#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For now, just copy the PNG file to all icon locations
// In production, you'd use a library like sharp to resize properly
const sourceLogo = path.join(__dirname, '../attached_assets/generated_images/StreamAiX_neural_glass_logo_7989ac90.png');
const publicDir = path.join(__dirname, '../public');

// Copy to public folder with different names
const iconFiles = [
  'favicon.ico',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

console.log('📦 Copying StreamAiX logo to icon files...');

iconFiles.forEach(filename => {
  const dest = path.join(publicDir, filename);
  fs.copyFileSync(sourceLogo, dest);
  console.log(`✅ Created ${filename}`);
});

console.log('🎉 All icon files generated successfully!');
