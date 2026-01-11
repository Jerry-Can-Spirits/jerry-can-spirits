/**
 * Generate 3 coordinated cartographic backgrounds for Shopify checkout
 * These will blend seamlessly together while maintaining the brand style
 */

const fs = require('fs');
const path = require('path');

// Shared color palette
const colors = {
  base: '#2a3421',           // Jerry Green 900
  contourPrimary: '#f59e0b',  // Gold
  contourSecondary: '#6b705c', // Muted green-gray
};

// Base SVG template with shared defs
const createSVGTemplate = (width, height, viewBox, content) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
  <defs>
    <linearGradient id="contourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.contourPrimary}" stop-opacity="0.6" />
      <stop offset="50%" stop-color="${colors.contourSecondary}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${colors.contourPrimary}" stop-opacity="0.6" />
    </linearGradient>

    <pattern id="topoPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1" fill="${colors.contourPrimary}" fill-opacity="0.3" />
      <circle cx="10" cy="10" r="0.5" fill="${colors.contourSecondary}" fill-opacity="0.2" />
      <circle cx="30" cy="30" r="0.5" fill="${colors.contourSecondary}" fill-opacity="0.2" />
    </pattern>
  </defs>

  <!-- Base background -->
  <rect width="100%" height="100%" fill="${colors.base}" />

  <!-- Topographic texture -->
  <rect width="100%" height="100%" fill="url(#topoPattern)" />

  ${content}
</svg>`;

// Header Background - Horizontal banner at top
const createHeaderBackground = () => {
  const content = `
  <!-- Contour lines - horizontal emphasis -->
  <g stroke="url(#contourGradient)" stroke-width="0.8" fill="none" opacity="0.4">
    <path d="M0,80 Q480,60 960,80 Q1440,100 1920,80" />
    <path d="M0,110 Q480,90 960,110 Q1440,130 1920,110" />
    <path d="M0,140 Q480,120 960,140 Q1440,160 1920,140" />
  </g>

  <!-- Grid lines -->
  <g stroke="${colors.contourSecondary}" stroke-width="0.3" stroke-opacity="0.3" fill="none">
    ${Array.from({length: 20}, (_, i) =>
      `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="200" />`
    ).join('\n    ')}
    ${Array.from({length: 3}, (_, i) =>
      `<line x1="0" y1="${i * 100}" x2="1920" y2="${i * 100}" />`
    ).join('\n    ')}
  </g>

  <!-- Compass rose - small, top left -->
  <g transform="translate(80,100)" opacity="0.3">
    <circle cx="0" cy="0" r="20" stroke="${colors.contourPrimary}" stroke-width="0.8" fill="none" />
    <circle cx="0" cy="0" r="10" stroke="${colors.contourPrimary}" stroke-width="0.4" fill="none" />
    <path d="M0,-18 L2,-12 L0,-8 L-2,-12 Z" fill="${colors.contourPrimary}" />
    <text x="0" y="-25" text-anchor="middle" font-size="8" fill="${colors.contourPrimary}" font-weight="bold">N</text>
  </g>

  <!-- Coordinate markers - subtle -->
  <g font-size="7" fill="${colors.contourPrimary}" opacity="0.25" font-family="monospace">
    <text x="1800" y="30">51°30'N</text>
    <text x="1800" y="42">0°07'W</text>
  </g>
  `;

  return createSVGTemplate(1920, 200, '0 0 1920 200', content);
};

// Left Sidebar Background - Vertical for order summary
const createSidebarBackground = () => {
  const content = `
  <!-- Contour lines - vertical emphasis, align with header at top -->
  <g stroke="url(#contourGradient)" stroke-width="0.7" fill="none" opacity="0.35">
    <!-- Top contours that connect to header -->
    <path d="M50,0 Q80,40 50,80 Q20,120 50,160" />
    <path d="M150,0 Q180,50 150,100 Q120,150 150,200" />
    <path d="M250,0 Q280,60 250,120 Q220,180 250,240" />
    <path d="M350,0 Q380,70 350,140 Q320,210 350,280" />
    <path d="M450,0 Q480,80 450,160 Q420,240 450,320" />

    <!-- Mid contours -->
    <path d="M100,400 Q130,480 100,560 Q70,640 100,720" />
    <path d="M200,450 Q230,530 200,610 Q170,690 200,770" />
    <path d="M300,500 Q330,580 300,660 Q270,740 300,820" />
    <path d="M400,550 Q430,630 400,710 Q370,790 400,870" />

    <!-- Bottom contours -->
    <path d="M80,900 Q110,960 80,1020 Q50,1080 80,1140 Q110,1200 80,1200" />
    <path d="M250,950 Q280,1010 250,1070 Q220,1130 250,1190" />
  </g>

  <!-- Grid lines -->
  <g stroke="${colors.contourSecondary}" stroke-width="0.3" stroke-opacity="0.25" fill="none">
    ${Array.from({length: 6}, (_, i) =>
      `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="1200" />`
    ).join('\n    ')}
    ${Array.from({length: 13}, (_, i) =>
      `<line x1="0" y1="${i * 100}" x2="500" y2="${i * 100}" />`
    ).join('\n    ')}
  </g>

  <!-- Islands/elevation markers -->
  <g stroke="url(#contourGradient)" stroke-width="0.6" fill="none" opacity="0.3">
    <ellipse cx="250" cy="400" rx="40" ry="25" />
    <ellipse cx="235" cy="410" rx="25" ry="15" />
    <ellipse cx="150" cy="700" rx="30" ry="20" />
    <ellipse cx="140" cy="695" rx="15" ry="10" />
    <ellipse cx="350" cy="950" rx="35" ry="22" />
  </g>

  <!-- Coordinate markers -->
  <g opacity="0.3">
    <g transform="translate(100,300)">
      <circle cx="0" cy="0" r="2.5" fill="${colors.contourPrimary}" opacity="0.8" />
      <circle cx="0" cy="0" r="5" stroke="${colors.contourPrimary}" stroke-width="0.4" fill="none" />
    </g>
    <g transform="translate(380,600)">
      <circle cx="0" cy="0" r="2.5" fill="${colors.contourPrimary}" opacity="0.8" />
      <circle cx="0" cy="0" r="5" stroke="${colors.contourPrimary}" stroke-width="0.4" fill="none" />
    </g>
    <g transform="translate(200,900)">
      <circle cx="0" cy="0" r="2.5" fill="${colors.contourPrimary}" opacity="0.8" />
      <circle cx="0" cy="0" r="5" stroke="${colors.contourPrimary}" stroke-width="0.4" fill="none" />
    </g>
  </g>

  <!-- Depth soundings -->
  <g font-size="5" fill="${colors.contourSecondary}" opacity="0.2" font-family="monospace">
    <text x="120" y="350">24</text>
    <text x="250" y="450">31</text>
    <text x="350" y="550">18</text>
    <text x="180" y="750">27</text>
    <text x="300" y="850">35</text>
    <text x="220" y="1050">29</text>
  </g>
  `;

  return createSVGTemplate(500, 1200, '0 0 500 1200', content);
};

// Main Content Background - Right side
const createMainBackground = () => {
  const content = `
  <!-- Contour lines - organic flow, connects to header at top -->
  <g stroke="url(#contourGradient)" stroke-width="0.6" fill="none" opacity="0.3">
    <!-- Top contours that connect to header -->
    <path d="M0,80 Q355,60 710,80 Q1065,100 1420,80" />
    <path d="M0,110 Q355,90 710,110 Q1065,130 1420,110" />
    <path d="M0,140 Q355,120 710,140 Q1065,160 1420,140" />

    <!-- Mountain range contours -->
    <path d="M100,250 Q355,230 610,250 Q865,270 1120,250 Q1300,230 1420,250" />
    <path d="M130,270 Q355,250 580,270 Q835,290 1090,270 Q1270,250 1390,270" />
    <path d="M160,290 Q355,270 550,290 Q805,310 1060,290 Q1240,270 1360,290" />

    <!-- Valley contours -->
    <path d="M150,500 Q450,520 750,500 Q1050,480 1350,500" />
    <path d="M170,520 Q450,540 730,520 Q1030,500 1330,520" />
    <path d="M190,540 Q450,560 710,540 Q1010,520 1310,540" />

    <!-- Coastal contours -->
    <path d="M100,850 Q280,830 460,850 Q730,870 1000,850 Q1210,830 1350,850" />
    <path d="M130,870 Q310,850 490,870 Q760,890 1030,870 Q1240,850 1380,870" />

    <!-- Lower contours that can align with sidebar bottom -->
    <path d="M100,1080 Q450,1100 800,1080 Q1150,1060 1400,1080" />
  </g>

  <!-- Grid lines -->
  <g stroke="${colors.contourSecondary}" stroke-width="0.3" stroke-opacity="0.25" fill="none">
    ${Array.from({length: 15}, (_, i) =>
      `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="1200" />`
    ).join('\n    ')}
    ${Array.from({length: 13}, (_, i) =>
      `<line x1="0" y1="${i * 100}" x2="1420" y2="${i * 100}" />`
    ).join('\n    ')}
  </g>

  <!-- Island/elevation features -->
  <g stroke="url(#contourGradient)" stroke-width="0.5" fill="none" opacity="0.25">
    <ellipse cx="350" cy="600" rx="50" ry="30" />
    <ellipse cx="330" cy="610" rx="30" ry="18" />
    <ellipse cx="900" cy="400" rx="40" ry="25" />
    <ellipse cx="885" cy="395" rx="20" ry="12" />
    <ellipse cx="1200" cy="750" rx="45" ry="28" />
  </g>

  <!-- Coordinate markers - sparse to avoid cluttering form -->
  <g opacity="0.3">
    <g transform="translate(250,350)">
      <circle cx="0" cy="0" r="2.5" fill="${colors.contourPrimary}" opacity="0.8" />
      <circle cx="0" cy="0" r="5" stroke="${colors.contourPrimary}" stroke-width="0.4" fill="none" />
      <rect x="10" y="-10" width="65" height="16" rx="2" fill="${colors.base}" fill-opacity="0.95" stroke="${colors.contourPrimary}" stroke-width="0.4" />
      <text x="15" y="-3" font-size="6" fill="${colors.contourPrimary}" font-family="monospace" font-weight="bold">52°30'N</text>
      <text x="15" y="4" font-size="6" fill="${colors.contourPrimary}" font-family="monospace" font-weight="bold">3°18'W</text>
    </g>

    <g transform="translate(1100,650)">
      <circle cx="0" cy="0" r="2.5" fill="${colors.contourPrimary}" opacity="0.8" />
      <circle cx="0" cy="0" r="5" stroke="${colors.contourPrimary}" stroke-width="0.4" fill="none" />
      <rect x="10" y="-10" width="65" height="16" rx="2" fill="${colors.base}" fill-opacity="0.95" stroke="${colors.contourPrimary}" stroke-width="0.4" />
      <text x="15" y="-3" font-size="6" fill="${colors.contourPrimary}" font-family="monospace" font-weight="bold">53°49'N</text>
      <text x="15" y="4" font-size="6" fill="${colors.contourPrimary}" font-family="monospace" font-weight="bold">3°03'W</text>
    </g>
  </g>

  <!-- Scale bar - bottom right -->
  <g transform="translate(1250,1150)" opacity="0.3">
    <line x1="0" y1="0" x2="100" y2="0" stroke="${colors.contourPrimary}" stroke-width="1.5" />
    <line x1="0" y1="-3" x2="0" y2="3" stroke="${colors.contourPrimary}" stroke-width="0.8" />
    <line x1="50" y1="-3" x2="50" y2="3" stroke="${colors.contourPrimary}" stroke-width="0.8" />
    <line x1="100" y1="-3" x2="100" y2="3" stroke="${colors.contourPrimary}" stroke-width="0.8" />
    <text x="50" y="-8" text-anchor="middle" font-size="7" fill="${colors.contourPrimary}">100km</text>
  </g>

  <!-- Depth soundings -->
  <g font-size="5" fill="${colors.contourSecondary}" opacity="0.2" font-family="monospace">
    <text x="200" y="550">24</text>
    <text x="450" y="650">31</text>
    <text x="700" y="500">18</text>
    <text x="950" y="800">27</text>
    <text x="500" y="950">35</text>
    <text x="1000" y="450">29</text>
  </g>

  <!-- Expedition route lines - very subtle -->
  <g stroke="${colors.contourPrimary}" stroke-width="0.8" stroke-dasharray="4,3" fill="none" opacity="0.2">
    <path d="M200,600 Q500,400 900,450 Q1200,500 1350,300" />
  </g>
  `;

  return createSVGTemplate(1420, 1200, '0 0 1420 1200', content);
};

// Create output directory
const outputDir = path.join(process.cwd(), 'public', 'checkout-backgrounds');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate all three backgrounds
console.log('🗺️  Generating cartographic checkout backgrounds...\n');

const backgrounds = {
  'header.svg': createHeaderBackground(),
  'sidebar.svg': createSidebarBackground(),
  'main.svg': createMainBackground(),
};

Object.entries(backgrounds).forEach(([filename, content]) => {
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(`✅ Generated ${filename}`);
});

console.log(`\n✨ All backgrounds generated in: ${outputDir}`);
console.log('\n📋 Next steps:');
console.log('1. Go to Shopify Admin → Settings → Checkout');
console.log('2. Scroll to "Branding" section');
console.log('3. Upload these backgrounds:');
console.log('   - Header background: header.svg');
console.log('   - Sidebar background: sidebar.svg');
console.log('   - Main content background: main.svg');
console.log('\n💡 Tip: These backgrounds are designed to blend seamlessly at their edges!');
