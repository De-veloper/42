import sharp from 'sharp';
import { writeFileSync } from 'fs';

const SIZE = 1024;
const PAD = 80; // safe zone padding

const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00BFFF"/>
      <stop offset="50%" stop-color="#00E5CC"/>
      <stop offset="100%" stop-color="#39FF14"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00BFFF" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#39FF14" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="#020B18"/>

  <!-- Subtle radial glow top-centre -->
  <radialGradient id="topGlow" cx="50%" cy="30%" r="55%">
    <stop offset="0%" stop-color="#00BFFF" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="#020B18" stop-opacity="0"/>
  </radialGradient>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#topGlow)"/>

  <!-- "42" text -->
  <text
    x="${SIZE / 2}"
    y="${SIZE / 2 + 130}"
    font-family="Helvetica Neue, Arial, sans-serif"
    font-weight="900"
    font-size="560"
    text-anchor="middle"
    fill="url(#textGrad)"
    filter="url(#glow)"
    letter-spacing="-20"
  >42</text>

  <!-- Thin teal underline accent -->
  <rect
    x="${PAD * 2}"
    y="${SIZE - PAD * 2}"
    width="${SIZE - PAD * 4}"
    height="6"
    rx="3"
    fill="url(#textGrad)"
    opacity="0.6"
  />
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile('./assets/icon.png')
  .then(() => console.log('✅ assets/icon.png generated (1024×1024)'))
  .catch(err => console.error('❌', err));
