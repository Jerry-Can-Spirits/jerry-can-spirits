/**
 * Convert SVG checkout backgrounds to high-quality PNG
 * Uses sharp library for optimal quality
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const inputDir = path.join(process.cwd(), 'public', 'checkout-backgrounds');
const outputDir = inputDir; // Save PNGs in same directory

// Check if sharp is installed
async function checkSharp() {
  try {
    require.resolve('sharp');
    return true;
  } catch {
    return false;
  }
}

// Convert using sharp (preferred method)
async function convertWithSharp() {
  const sharp = require('sharp');

  const conversions = [
    { input: 'header.svg', output: 'header.png', width: 1920, height: 200 },
    { input: 'sidebar.svg', output: 'sidebar.png', width: 500, height: 1200 },
    { input: 'main.svg', output: 'main.png', width: 1420, height: 1200 },
  ];

  console.log('🖼️  Converting SVG backgrounds to PNG using Sharp...\n');

  for (const conversion of conversions) {
    const inputPath = path.join(inputDir, conversion.input);
    const outputPath = path.join(outputDir, conversion.output);

    try {
      await sharp(inputPath, {
        density: 150 // High DPI for quality
      })
        .resize(conversion.width, conversion.height)
        .png({
          compressionLevel: 9,
          quality: 100
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✅ ${conversion.output} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`❌ Failed to convert ${conversion.input}:`, error.message);
    }
  }
}

// Fallback: Use Node.js canvas or imagemagick if available
async function convertWithCanvas() {
  console.log('🖼️  Converting SVG backgrounds to PNG using node-canvas...\n');

  try {
    const { createCanvas, Image } = require('canvas');

    const conversions = [
      { input: 'header.svg', output: 'header.png', width: 1920, height: 200 },
      { input: 'sidebar.svg', output: 'sidebar.png', width: 500, height: 1200 },
      { input: 'main.svg', output: 'main.png', width: 1420, height: 1200 },
    ];

    for (const conversion of conversions) {
      const inputPath = path.join(inputDir, conversion.input);
      const outputPath = path.join(outputDir, conversion.output);

      const canvas = createCanvas(conversion.width, conversion.height);
      const ctx = canvas.getContext('2d');

      const svg = fs.readFileSync(inputPath, 'utf8');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, conversion.width, conversion.height);
          const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });
          fs.writeFileSync(outputPath, buffer);
          const stats = fs.statSync(outputPath);
          console.log(`✅ ${conversion.output} (${(stats.size / 1024).toFixed(1)} KB)`);
          resolve();
        };
        img.onerror = reject;
        img.src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      });
    }
  } catch (error) {
    throw new Error('node-canvas not available: ' + error.message);
  }
}

// Simple fallback without dependencies - create instruction file
async function createInstructions() {
  console.log('⚠️  No PNG conversion libraries available.\n');
  console.log('📝 Creating manual conversion instructions...\n');

  const instructions = `# Manual SVG to PNG Conversion

The SVG backgrounds have been generated, but automatic PNG conversion requires additional dependencies.

## Option 1: Install Sharp (Recommended)
Run: npm install sharp
Then run: node scripts/convert-backgrounds-to-png.js

## Option 2: Use Online Converter
1. Go to: https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload and convert each file:
   - header.svg → header.png (1920x200px)
   - sidebar.svg → sidebar.png (500x1200px)
   - main.svg → main.png (1420x1200px)
3. Use maximum quality settings
4. Save the PNG files back to: public/checkout-backgrounds/

## Option 3: Use Shopify's SVG Support
Shopify checkout accepts SVG files directly. You can upload the .svg files without converting!

Files to upload:
- ${path.join(inputDir, 'header.svg')}
- ${path.join(inputDir, 'sidebar.svg')}
- ${path.join(inputDir, 'main.svg')}
`;

  const instructionsPath = path.join(outputDir, 'CONVERSION_INSTRUCTIONS.txt');
  fs.writeFileSync(instructionsPath, instructions);
  console.log(`✅ Instructions saved to: ${instructionsPath}\n`);
  console.log('💡 Good news: Shopify checkout accepts SVG files directly!');
  console.log('   You can upload the .svg files without converting.\n');
}

// Main execution
async function main() {
  // Check if SVG files exist
  const svgFiles = ['header.svg', 'sidebar.svg', 'main.svg'];
  const allExist = svgFiles.every(file =>
    fs.existsSync(path.join(inputDir, file))
  );

  if (!allExist) {
    console.error('❌ SVG files not found. Run generate-checkout-backgrounds.js first.');
    process.exit(1);
  }

  // Try conversion methods in order of preference
  try {
    if (await checkSharp()) {
      await convertWithSharp();
      console.log('\n✨ PNG conversion complete using Sharp!');
    } else {
      console.log('⚠️  Sharp not installed. Attempting to install...\n');
      try {
        await execAsync('npm install sharp --no-save');
        await convertWithSharp();
        console.log('\n✨ PNG conversion complete using Sharp!');
      } catch (installError) {
        console.log('⚠️  Could not install Sharp automatically.\n');
        try {
          await convertWithCanvas();
          console.log('\n✨ PNG conversion complete using node-canvas!');
        } catch (canvasError) {
          await createInstructions();
        }
      }
    }
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    await createInstructions();
  }

  console.log('\n📋 Files ready in: ' + outputDir);
  console.log('\n🎨 Next: Upload to Shopify Admin → Settings → Checkout → Branding');
}

main().catch(console.error);
