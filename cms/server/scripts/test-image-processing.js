#!/usr/bin/env node

/**
 * 手动测试图片处理功能的脚本
 * 使用方法: node scripts/test-image-processing.js [image-path]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { 
  stripImageMetadata, 
  isSupportedImageFormat, 
  checkImagePrivacy,
  getImageInfo,
  readImageExif
} from '../utils/imageProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTestImage() {
  const testDir = path.join(__dirname, '../test-temp');
  await fs.ensureDir(testDir);
  
  const testImagePath = path.join(testDir, 'test-image-with-exif.jpg');
  
  console.log('Creating test image with EXIF data...');
  
  // 创建一个带有EXIF信息的测试图片
  const image = sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 70, g: 130, b: 180 }
    }
  });

  // 添加文本水印
  const textSvg = `
    <svg width="800" height="600">
      <text x="400" y="300" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
        Test Image with EXIF
      </text>
      <text x="400" y="350" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
        Created: ${new Date().toISOString()}
      </text>
    </svg>
  `;

  const imageWithText = image.composite([{
    input: Buffer.from(textSvg),
    top: 0,
    left: 0
  }]);

  // 添加EXIF数据
  const imageWithExif = imageWithText.jpeg({
    quality: 95
  }).withMetadata({
    exif: {
      IFD0: {
        Make: 'Canon',
        Model: 'EOS R5',
        Software: 'Adobe Lightroom',
        DateTime: '2023:12:01 14:30:25',
        Artist: 'John Photographer',
        Copyright: '© 2023 John Photographer'
      },
      ExifIFD: {
        DateTimeOriginal: '2023:12:01 14:30:25',
        DateTimeDigitized: '2023:12:01 14:30:25',
        ISO: '400',
        FNumber: '2.8',
        ExposureTime: '1/125'
      },
      GPS: {
        GPSLatitude: '40,45,30',
        GPSLongitude: '73,59,0',
        GPSLatitudeRef: 'N',
        GPSLongitudeRef: 'W'
      }
    }
  });

  await imageWithExif.toFile(testImagePath);
  console.log(`Test image created: ${testImagePath}`);
  return testImagePath;
}

async function testImageProcessing(imagePath) {
  console.log('\n=== Image Processing Test ===');
  console.log(`Testing image: ${imagePath}`);
  
  // 检查文件是否存在
  if (!await fs.pathExists(imagePath)) {
    console.error('❌ Image file not found!');
    return;
  }

  // 检查是否为支持的格式
  if (!isSupportedImageFormat(imagePath)) {
    console.error('❌ Unsupported image format!');
    return;
  }

  console.log('✅ Image file found and format supported');

  try {
    // 1. 获取图片基本信息
    console.log('\n--- Basic Image Info ---');
    const imageInfo = await getImageInfo(imagePath);
    if (imageInfo) {
      console.log(`📐 Dimensions: ${imageInfo.width}x${imageInfo.height}`);
      console.log(`📁 Format: ${imageInfo.format}`);
      console.log(`💾 Size: ${(imageInfo.size / 1024).toFixed(2)} KB`);
      console.log(`🎨 Channels: ${imageInfo.channels}`);
      console.log(`🔍 Has Alpha: ${imageInfo.hasAlpha}`);
    }

    // 2. 读取EXIF信息
    console.log('\n--- EXIF Data Analysis ---');
    const exifData = await readImageExif(imagePath);
    if (exifData) {
      console.log(`📊 EXIF keys found: ${Object.keys(exifData).length}`);
      console.log('📋 EXIF data preview:');
      
      // 显示一些关键的EXIF信息
      const keyFields = ['Make', 'Model', 'Software', 'DateTime', 'Artist', 'Copyright', 'GPS'];
      keyFields.forEach(field => {
        if (exifData[field]) {
          console.log(`   ${field}: ${JSON.stringify(exifData[field])}`);
        }
      });
    } else {
      console.log('📊 No EXIF data found');
    }

    // 3. 隐私检查
    console.log('\n--- Privacy Check ---');
    const privacyCheck = await checkImagePrivacy(imagePath);
    if (privacyCheck.hasSensitiveData) {
      console.log('⚠️  Privacy issues detected:');
      privacyCheck.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    } else {
      console.log('✅ No privacy issues detected');
    }

    // 4. 抹除元信息
    console.log('\n--- Metadata Stripping ---');
    const outputPath = imagePath.replace(/(\.[^.]+)$/, '-stripped$1');
    
    console.log('🔄 Processing image...');
    const result = await stripImageMetadata(imagePath, outputPath, {
      quality: 85,
      progressive: true,
      optimizeForWeb: true
    });

    if (result.success) {
      console.log('✅ Metadata stripping successful!');
      console.log(`📉 Size reduction: ${result.compressionRatio}%`);
      console.log(`📁 Original size: ${(result.originalSize / 1024).toFixed(2)} KB`);
      console.log(`📁 Processed size: ${(result.processedSize / 1024).toFixed(2)} KB`);
      console.log(`🗑️  EXIF removed: ${result.exifRemoved.exifRemoved}`);
      console.log(`📊 EXIF keys removed: ${result.exifRemoved.originalExifKeys}`);

      // 5. 验证处理结果
      console.log('\n--- Verification ---');
      const processedExif = await readImageExif(outputPath);
      if (processedExif) {
        console.log(`⚠️  Warning: ${Object.keys(processedExif).length} EXIF keys still remain`);
      } else {
        console.log('✅ All EXIF data successfully removed');
      }

      const processedPrivacyCheck = await checkImagePrivacy(outputPath);
      if (processedPrivacyCheck.hasSensitiveData) {
        console.log('⚠️  Warning: Privacy issues still detected:');
        processedPrivacyCheck.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      } else {
        console.log('✅ No privacy issues in processed image');
      }

      console.log(`\n📁 Processed image saved to: ${outputPath}`);
    } else {
      console.error('❌ Metadata stripping failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let imagePath = args[0];

  if (!imagePath) {
    console.log('No image path provided, creating test image...');
    imagePath = await createTestImage();
  }

  await testImageProcessing(imagePath);
  
  console.log('\n=== Test Complete ===');
}

// 运行测试
main().catch(console.error);
