#!/usr/bin/env node
/**
 * Cloudflare Images Migration Script
 *
 * This script uploads all images from /public/images to Cloudflare Images
 * and generates a mapping file for the custom image loader.
 *
 * Prerequisites:
 * - CLOUDFLARE_ACCOUNT_ID environment variable
 * - CLOUDFLARE_API_TOKEN environment variable (with Images Write permissions)
 *
 * Usage:
 *   node scripts/migrate-to-cloudflare-images.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   Show what would be uploaded without actually uploading
 *   --verbose   Show detailed output for each operation
 */

const fs = require('fs').promises
const path = require('path')
const { glob } = require('glob')

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const IMAGES_DIR = path.join(__dirname, '../public/images')
const OUTPUT_MAPPING_FILE = path.join(__dirname, 'image-mapping.json')
const CLOUDFLARE_IMAGES_API = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`

// Parse CLI arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isVerbose = args.includes('--verbose')

/**
 * Upload a single image to Cloudflare Images
 */
async function uploadImageToCloudflare(filePath, imageId) {
  const FormData = (await import('node:stream/web')).FormData || global.FormData
  const formData = new FormData()
  const fileBuffer = await fs.readFile(filePath)
  const blob = new Blob([fileBuffer])

  formData.append('file', blob, path.basename(filePath))
  formData.append('id', imageId) // Custom ID for easier management

  const response = await fetch(CLOUDFLARE_IMAGES_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload failed: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

/**
 * Generate a consistent image ID from the file path
 * Example: /images/hero/hero-spiced.webp → hero-hero-spiced-webp
 */
function generateImageId(relativePath) {
  return relativePath
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/\./g, '-')
    .toLowerCase()
}

/**
 * Discover all images in the /public/images directory
 */
async function discoverImages() {
  const imageExtensions = ['webp', 'png', 'svg', 'jpg', 'jpeg', 'gif']
  const patterns = imageExtensions.map((ext) => `**/*.${ext}`)

  const allFiles = []
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: IMAGES_DIR,
      nodir: true,
    })
    allFiles.push(...files)
  }

  return allFiles.map((file) => ({
    originalPath: `/images/${file.replace(/\\/g, '/')}`, // Normalize Windows paths
    absolutePath: path.join(IMAGES_DIR, file),
    relativePath: file,
  }))
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('🚀 Starting Cloudflare Images Migration\n')

  // Validate environment variables
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('❌ Missing required environment variables:')
    console.error('   - CLOUDFLARE_ACCOUNT_ID')
    console.error('   - CLOUDFLARE_API_TOKEN')
    console.error('\nPlease add these to your .env.local file')
    process.exit(1)
  }

  // Discover images
  console.log('📂 Discovering images...')
  const images = await discoverImages()
  console.log(`   Found ${images.length} images\n`)

  if (images.length === 0) {
    console.error('❌ No images found in /public/images')
    process.exit(1)
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No uploads will be performed\n')
    console.log('Images that would be uploaded:')
    images.forEach((img, i) => {
      const imageId = generateImageId(img.originalPath)
      console.log(`   ${i + 1}. ${img.originalPath} → ${imageId}`)
    })
    console.log(`\nTotal: ${images.length} images`)
    return
  }

  // Upload images
  const mapping = {}
  const errors = []
  let successCount = 0

  console.log('⬆️  Uploading images to Cloudflare...\n')

  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const imageId = generateImageId(image.originalPath)

    try {
      console.log(`[${i + 1}/${images.length}] Uploading: ${image.originalPath}`)

      const result = await uploadImageToCloudflare(image.absolutePath, imageId)

      mapping[image.originalPath] = {
        cloudflareId: result.result.id,
        cloudflareUrl: result.result.variants?.[0] || `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${result.result.id}`,
        filename: result.result.filename,
        uploadedAt: new Date().toISOString(),
      }

      successCount++

      if (isVerbose) {
        console.log(`   ✅ Success: ${result.result.id}`)
      }

      // Rate limiting: 1 request per 100ms to be respectful to API
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`)
      errors.push({ image: image.originalPath, error: error.message })
    }
  }

  // Save mapping file
  console.log('\n💾 Saving image mapping...')
  await fs.writeFile(OUTPUT_MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8')

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Migration Complete!')
  console.log('='.repeat(60))
  console.log(`   Successful uploads: ${successCount}`)
  console.log(`   Failed uploads:     ${errors.length}`)
  console.log(`   Mapping saved to:   ${OUTPUT_MAPPING_FILE}`)

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    errors.forEach((err) => console.log(`   - ${err.image}: ${err.error}`))
    console.log('\nYou can re-run this script to retry failed uploads.')
  } else {
    console.log('\n🎉 All images successfully migrated!')
    console.log('\nNext steps:')
    console.log('1. Commit the image-mapping.json file to git')
    console.log('2. Add NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH to .env.local')
    console.log('3. Update next.config.ts to use the custom image loader')
    console.log('4. Test locally with: npm run dev')
  }
}

// Run migration with error handling
migrateImages().catch((error) => {
  console.error('\n💥 Migration failed with error:', error)
  process.exit(1)
})
