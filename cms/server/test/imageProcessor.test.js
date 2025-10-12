import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
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

// 测试目录
const TEST_DIR = path.join(__dirname, 'temp');
const TEST_IMAGES_DIR = path.join(TEST_DIR, 'images');

describe('Image Processor', () => {
  beforeAll(async () => {
    // 创建测试目录
    await fs.ensureDir(TEST_IMAGES_DIR);
    
    // 创建测试图片（带有EXIF信息）
    await createTestImageWithExif();
  });

  afterAll(async () => {
    // 清理测试目录
    await fs.remove(TEST_DIR);
  });

  describe('isSupportedImageFormat', () => {
    it('should return true for supported formats', () => {
      expect(isSupportedImageFormat('test.jpg')).toBe(true);
      expect(isSupportedImageFormat('test.jpeg')).toBe(true);
      expect(isSupportedImageFormat('test.png')).toBe(true);
      expect(isSupportedImageFormat('test.webp')).toBe(true);
      expect(isSupportedImageFormat('test.tiff')).toBe(true);
      expect(isSupportedImageFormat('test.tif')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isSupportedImageFormat('test.gif')).toBe(false);
      expect(isSupportedImageFormat('test.bmp')).toBe(false);
      expect(isSupportedImageFormat('test.txt')).toBe(false);
      expect(isSupportedImageFormat('test.pdf')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isSupportedImageFormat('test.JPG')).toBe(true);
      expect(isSupportedImageFormat('test.PNG')).toBe(true);
      expect(isSupportedImageFormat('test.WEBP')).toBe(true);
    });
  });

  describe('getImageInfo', () => {
    it('should return basic image information', async () => {
      const testImagePath = path.join(TEST_IMAGES_DIR, 'test-with-exif.jpg');
      const info = await getImageInfo(testImagePath);
      
      expect(info).toBeDefined();
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
      expect(info.format).toBe('jpeg');
      expect(info.size).toBeGreaterThan(0);
    });

    it('should return null for unsupported formats', async () => {
      const info = await getImageInfo('nonexistent.gif');
      expect(info).toBeNull();
    });
  });

  describe('readImageExif', () => {
    it('should read EXIF data from image with metadata', async () => {
      const testImagePath = path.join(TEST_IMAGES_DIR, 'test-with-exif.jpg');
      const exifData = await readImageExif(testImagePath);
      
      expect(exifData).toBeDefined();
      // 检查是否包含我们添加的测试EXIF数据
      expect(exifData.Make).toBe('Test Camera');
      expect(exifData.Model).toBe('Test Model');
    });

    it('should return null for images without EXIF data', async () => {
      // 创建一个没有EXIF数据的简单图片
      const simpleImagePath = path.join(TEST_IMAGES_DIR, 'simple.png');
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).png().toFile(simpleImagePath);

      const exifData = await readImageExif(simpleImagePath);
      expect(exifData).toBeNull();
    });
  });

  describe('checkImagePrivacy', () => {
    it('should detect privacy issues in image with EXIF data', async () => {
      const testImagePath = path.join(TEST_IMAGES_DIR, 'test-with-exif.jpg');
      const privacyCheck = await checkImagePrivacy(testImagePath);
      
      expect(privacyCheck.hasSensitiveData).toBe(true);
      expect(privacyCheck.issues).toContain('Camera/device information found');
      expect(privacyCheck.issues).toContain('Timestamp information found');
    });

    it('should not detect issues in clean image', async () => {
      const simpleImagePath = path.join(TEST_IMAGES_DIR, 'simple.png');
      const privacyCheck = await checkImagePrivacy(simpleImagePath);
      
      expect(privacyCheck.hasSensitiveData).toBe(false);
      expect(privacyCheck.issues).toHaveLength(0);
    });
  });

  describe('stripImageMetadata', () => {
    it('should successfully strip metadata from image', async () => {
      const testImagePath = path.join(TEST_IMAGES_DIR, 'test-with-exif.jpg');
      const outputPath = path.join(TEST_IMAGES_DIR, 'test-stripped.jpg');
      
      const result = await stripImageMetadata(testImagePath, outputPath);
      
      expect(result.success).toBe(true);
      expect(result.exifRemoved.exifRemoved).toBe(true);
      expect(result.exifRemoved.originalExifKeys).toBeGreaterThan(0);
      expect(result.exifRemoved.remainingExifKeys).toBe(0);
      
      // 验证输出文件存在
      expect(await fs.pathExists(outputPath)).toBe(true);
      
      // 验证输出文件确实没有EXIF数据
      const strippedExif = await readImageExif(outputPath);
      expect(strippedExif).toBeNull();
    });

    it('should handle unsupported formats gracefully', async () => {
      const result = await stripImageMetadata('test.gif');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported image format');
    });

    it('should optimize file size', async () => {
      const testImagePath = path.join(TEST_IMAGES_DIR, 'test-with-exif.jpg');
      const outputPath = path.join(TEST_IMAGES_DIR, 'test-optimized.jpg');
      
      const result = await stripImageMetadata(testImagePath, outputPath, {
        quality: 80,
        optimizeForWeb: true
      });
      
      expect(result.success).toBe(true);
      expect(result.processedSize).toBeLessThanOrEqual(result.originalSize);
      expect(parseFloat(result.compressionRatio)).toBeGreaterThanOrEqual(0);
    });
  });
});

// 辅助函数：创建带有EXIF信息的测试图片
async function createTestImageWithExif() {
  const testImagePath = path.join(TEST_IMAGES_DIR, 'test-with-exif.jpg');
  
  // 创建一个简单的图片
  const image = sharp({
    create: {
      width: 300,
      height: 200,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  });

  // 添加一些EXIF数据
  const imageWithExif = image.jpeg({
    quality: 90
  }).withMetadata({
    exif: {
      IFD0: {
        Make: 'Test Camera',
        Model: 'Test Model',
        Software: 'Test Software',
        DateTime: '2023:12:01 12:00:00',
        Artist: 'Test Artist',
        Copyright: 'Test Copyright'
      },
      ExifIFD: {
        DateTimeOriginal: '2023:12:01 12:00:00',
        DateTimeDigitized: '2023:12:01 12:00:00'
      }
    }
  });

  await imageWithExif.toFile(testImagePath);
}
