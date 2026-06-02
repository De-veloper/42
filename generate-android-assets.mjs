import sharp from 'sharp';
import { mkdirSync } from 'fs';

// Android adaptive icon foreground (1024x1024, logo centred in safe zone)
const ICON_SIZE = 1024;
const SAFE = ICON_SIZE * 0.67; // safe zone is 66% of canvas
const offset = (ICON_SIZE - SAFE) / 2;

const iconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00BFFF"/>
      <stop offset="50%" stop-color="#00E5CC"/>
      <stop offset="100%" stop-color="#39FF14"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- transparent bg — Android composites on top of background layer -->
  <text
    x="${ICON_SIZE / 2}" y="${ICON_SIZE / 2 + 130}"
    font-family="Helvetica Neue, Arial, sans-serif"
    font-weight="900"
    font-size="560"
    text-anchor="middle"
    fill="url(#g)"
    filter="url(#glow)"
    letter-spacing="-20"
  >42</text>
</svg>`;

// Android splash (1920x1080 landscape + 1080x1920 portrait handled by Expo)
const SPLASH_W = 1284, SPLASH_H = 2778;
const splashSvg = `
<svg width="${SPLASH_W}" height="${SPLASH_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00BFFF"/>
      <stop offset="50%" stop-color="#00E5CC"/>
      <stop offset="100%" stop-color="#39FF14"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="46%" r="40%">
      <stop offset="0%" stop-color="#00BFFF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#020B18" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="24" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${SPLASH_W}" height="${SPLASH_H}" fill="#020B18"/>
  <rect width="${SPLASH_W}" height="${SPLASH_H}" fill="url(#bg)"/>

  <rect x="${SPLASH_W/2 - 90}" y="${SPLASH_H * 0.38}" width="180" height="180" rx="40"
    fill="url(#tg)" filter="url(#glow)"/>
  <text x="${SPLASH_W/2}" y="${SPLASH_H * 0.38 + 125}"
    font-family="Helvetica Neue,Arial,sans-serif" font-weight="900" font-size="110"
    text-anchor="middle" fill="#020B18" letter-spacing="-4">42</text>

  <text x="${SPLASH_W/2}" y="${SPLASH_H * 0.38 + 240}"
    font-family="Helvetica Neue,Arial,sans-serif" font-weight="900" font-size="72"
    text-anchor="middle" fill="url(#tg)" letter-spacing="6">42</text>

  <text x="${SPLASH_W/2}" y="${SPLASH_H * 0.38 + 310}"
    font-family="Helvetica Neue,Arial,sans-serif" font-weight="500" font-size="32"
    text-anchor="middle" fill="rgba(255,255,255,0.45)" letter-spacing="3">42-DAY FITNESS CHALLENGE</text>

  <rect x="${SPLASH_W/2 - 80}" y="${SPLASH_H * 0.38 + 345}"
    width="160" height="3" rx="1.5" fill="url(#tg)" opacity="0.5"/>
</svg>`;

await Promise.all([
  sharp(Buffer.from(iconSvg))
    .png()
    .toFile('./assets/android-icon-foreground.png')
    .then(() => console.log('✅ android-icon-foreground.png')),

  sharp(Buffer.from(splashSvg))
    .png()
    .toFile('./assets/splash-icon.png')
    .then(() => console.log('✅ splash-icon.png (shared iOS/Android)')),
]);
