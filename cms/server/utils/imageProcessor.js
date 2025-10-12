import sharp from 'sharp';
import exifr from 'exifr';
import fs from 'fs-extra';
import path from 'path';

/**
 * 支持的图片格式
 */
const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];

/**
 * 检查文件是否为支持的图片格式
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否为支持的图片格式
 */
export function isSupportedImageFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.includes(ext);
}

/**
 * 读取图片的EXIF信息
 * @param {string} filePath - 图片文件路径
 * @returns {Promise<Object|null>} EXIF信息对象，如果读取失败返回null
 */
export async function readImageExif(filePath) {
  try {
    if (!isSupportedImageFormat(filePath)) {
      return null;
    }
    
    const exifData = await exifr.parse(filePath);
    return exifData || null;
  } catch (error) {
    console.warn(`Failed to read EXIF data from ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 抹除图片的所有元信息（EXIF、IPTC、XMP等）
 * @param {string} inputPath - 输入图片路径
 * @param {string} outputPath - 输出图片路径（可选，默认覆盖原文件）
 * @param {Object} options - 处理选项
 * @param {number} options.quality - 图片质量 (1-100)，默认85
 * @param {boolean} options.progressive - 是否使用渐进式JPEG，默认true
 * @param {boolean} options.optimizeForWeb - 是否针对Web优化，默认true
 * @returns {Promise<Object>} 处理结果
 */
export async function stripImageMetadata(inputPath, outputPath = null, options = {}) {
  const {
    quality = 85,
    progressive = true,
    optimizeForWeb = true
  } = options;

  const isInPlace = !outputPath;
  const tempPath = isInPlace ? `${inputPath}.tmp` : null;
  const finalOutputPath = outputPath || inputPath;
  const actualOutputPath = isInPlace ? tempPath : outputPath;

  try {
    if (!isSupportedImageFormat(inputPath)) {
      throw new Error(`Unsupported image format: ${path.extname(inputPath)}`);
    }

    // 读取原始文件信息
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // 读取EXIF信息（用于日志记录）
    const originalExif = await readImageExif(inputPath);

    // 获取图片信息
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // 创建处理管道，移除所有元数据但保持图片方向
    // 使用 rotate() 方法保持原有方向，然后通过重新编码移除元数据
    let pipeline = sharp(inputPath)
      .rotate(); // 根据EXIF方向信息自动旋转，保持视觉方向正确

    // 注意：不使用 withMetadata(false)，而是通过重新编码来移除元数据

    // 根据图片格式进行优化
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({
        quality,
        progressive,
        mozjpeg: optimizeForWeb, // 使用mozjpeg编码器进行更好的压缩
        trellisQuantisation: optimizeForWeb,
        overshootDeringing: optimizeForWeb,
        optimizeScans: optimizeForWeb
      });
    } else if (ext === '.png') {
      pipeline = pipeline.png({
        quality,
        progressive,
        compressionLevel: optimizeForWeb ? 9 : 6,
        adaptiveFiltering: optimizeForWeb,
        palette: optimizeForWeb
      });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({
        quality,
        effort: optimizeForWeb ? 6 : 4
      });
    } else if (ext === '.tiff' || ext === '.tif') {
      pipeline = pipeline.tiff({
        quality,
        compression: 'lzw'
      });
    }

    // 确保输出目录存在
    await fs.ensureDir(path.dirname(actualOutputPath));

    // 处理图片到临时文件或最终输出路径
    await pipeline.toFile(actualOutputPath);

    // 如果是就地处理，将临时文件替换原文件
    if (isInPlace) {
      await fs.move(tempPath, finalOutputPath, { overwrite: true });
    }

    // 获取处理后的文件信息
    const processedStats = await fs.stat(finalOutputPath);
    const processedSize = processedStats.size;

    // 验证元数据是否已被移除
    const processedExif = await readImageExif(finalOutputPath);

    const result = {
      success: true,
      inputPath,
      outputPath: finalOutputPath,
      originalSize,
      processedSize,
      compressionRatio: ((originalSize - processedSize) / originalSize * 100).toFixed(2),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha
      },
      exifRemoved: {
        hadExif: !!originalExif,
        exifRemoved: !!originalExif && !processedExif,
        originalExifKeys: originalExif ? Object.keys(originalExif).length : 0,
        remainingExifKeys: processedExif ? Object.keys(processedExif).length : 0
      }
    };

    console.log(`Image processed: ${inputPath}`);
    console.log(`- Size: ${originalSize} → ${processedSize} bytes (${result.compressionRatio}% reduction)`);
    console.log(`- EXIF removed: ${result.exifRemoved.exifRemoved} (${result.exifRemoved.originalExifKeys} keys removed)`);

    return result;

  } catch (error) {
    console.error(`Error processing image ${inputPath}:`, error);

    // 清理临时文件（如果存在）
    if (isInPlace && tempPath && await fs.pathExists(tempPath)) {
      try {
        await fs.remove(tempPath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temp file ${tempPath}:`, cleanupError.message);
      }
    }

    return {
      success: false,
      error: error.message,
      inputPath,
      outputPath: finalOutputPath
    };
  }
}

/**
 * 批量处理图片，抹除元信息
 * @param {string[]} imagePaths - 图片文件路径数组
 * @param {Object} options - 处理选项
 * @returns {Promise<Object[]>} 处理结果数组
 */
export async function batchStripImageMetadata(imagePaths, options = {}) {
  const results = [];
  
  for (const imagePath of imagePaths) {
    try {
      const result = await stripImageMetadata(imagePath, null, options);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        inputPath: imagePath
      });
    }
  }
  
  return results;
}

/**
 * 获取图片的基本信息（不包含敏感的EXIF数据）
 * @param {string} filePath - 图片文件路径
 * @returns {Promise<Object|null>} 图片基本信息
 */
export async function getImageInfo(filePath) {
  try {
    if (!isSupportedImageFormat(filePath)) {
      return null;
    }

    const image = sharp(filePath);
    const metadata = await image.metadata();
    const stats = await fs.stat(filePath);

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: stats.size,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density,
      isAnimated: metadata.pages > 1
    };
  } catch (error) {
    console.error(`Error getting image info for ${filePath}:`, error);
    return null;
  }
}

/**
 * 检查图片是否包含敏感的元数据
 * @param {string} filePath - 图片文件路径
 * @returns {Promise<Object>} 检查结果
 */
export async function checkImagePrivacy(filePath) {
  try {
    const exifData = await readImageExif(filePath);
    
    if (!exifData) {
      return {
        hasSensitiveData: false,
        issues: []
      };
    }

    const issues = [];
    
    // 检查GPS信息
    if (exifData.GPS || exifData.GPSLatitude || exifData.GPSLongitude) {
      issues.push('GPS location data found');
    }
    
    // 检查设备信息
    if (exifData.Make || exifData.Model) {
      issues.push('Camera/device information found');
    }
    
    // 检查软件信息
    if (exifData.Software) {
      issues.push('Software information found');
    }
    
    // 检查拍摄时间
    if (exifData.DateTime || exifData.DateTimeOriginal || exifData.DateTimeDigitized) {
      issues.push('Timestamp information found');
    }
    
    // 检查作者信息
    if (exifData.Artist || exifData.Copyright) {
      issues.push('Author/copyright information found');
    }

    return {
      hasSensitiveData: issues.length > 0,
      issues,
      exifKeys: Object.keys(exifData)
    };
  } catch (error) {
    console.error(`Error checking image privacy for ${filePath}:`, error);
    return {
      hasSensitiveData: false,
      issues: [],
      error: error.message
    };
  }
}
