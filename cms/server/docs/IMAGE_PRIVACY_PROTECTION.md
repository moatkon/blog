# 图片隐私保护功能

## 概述

CMS系统现已集成图片隐私保护功能，可以自动抹除上传图片中的所有元信息（EXIF、IPTC、XMP等），防止隐私泄露。

## 功能特性

### 🔒 自动元信息抹除
- **EXIF数据移除**：包括相机型号、拍摄参数、GPS位置等
- **IPTC数据移除**：包括作者、版权、关键词等
- **XMP数据移除**：包括Adobe软件添加的元数据
- **完全清理**：确保所有敏感信息被彻底移除

### 🔍 隐私风险检测
- **GPS位置检测**：检查是否包含地理位置信息
- **设备信息检测**：检查相机/手机型号信息
- **软件信息检测**：检查编辑软件信息
- **时间戳检测**：检查拍摄时间信息
- **作者信息检测**：检查作者和版权信息

### 🎯 图片优化
- **文件压缩**：在保持质量的同时减小文件大小
- **格式优化**：针对Web使用进行优化
- **渐进式JPEG**：支持渐进式加载

## 配置选项

在 `cms/server/config.js` 中可以配置以下选项：

```javascript
export const IMAGE_PROCESSING_CONFIG = {
  // 是否启用图片元信息抹除
  enableMetadataStripping: true,
  
  // 是否启用图片优化
  enableOptimization: true,
  
  // 图片质量设置 (1-100)
  quality: 85,
  
  // 是否使用渐进式JPEG
  progressive: true,
  
  // 是否针对Web优化
  optimizeForWeb: true,
  
  // 支持的图片格式
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'],
  
  // 最大文件大小 (字节)
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // 是否记录处理日志
  enableLogging: true,
  
  // 是否在上传前检查隐私风险
  enablePrivacyCheck: true
};
```

## API接口

### 1. 文件上传 (自动处理)

**POST** `/api/assets/upload`

上传文件时会自动进行图片处理：

```javascript
// 请求
const formData = new FormData();
formData.append('file', imageFile);
formData.append('folder', 'images');

// 响应
{
  "message": "File uploaded successfully",
  "file": {
    "name": "image.jpg",
    "path": "images/image.jpg",
    "size": 12345,
    "mimetype": "image/jpeg"
  },
  "imageProcessing": {
    "metadataStripped": true,
    "compressionRatio": "25.5",
    "originalSize": 16384,
    "processedSize": 12345
  },
  "privacyCheck": {
    "hadSensitiveData": true,
    "issuesFound": 2,
    "issues": [
      "GPS location data found",
      "Camera/device information found"
    ]
  }
}
```

### 2. 隐私检查

**GET** `/api/assets/privacy-check/{path}`

检查已上传图片的隐私信息：

```javascript
// 响应
{
  "file": "images/image.jpg",
  "imageInfo": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size": 12345,
    "channels": 3,
    "hasAlpha": false
  },
  "privacyCheck": {
    "hasSensitiveData": false,
    "issues": []
  }
}
```

### 3. 手动元信息处理

**POST** `/api/assets/strip-metadata/{path}`

手动处理已上传的图片：

```javascript
// 请求体
{
  "quality": 85,
  "progressive": true,
  "optimizeForWeb": true
}

// 响应
{
  "message": "Image metadata stripped successfully",
  "result": {
    "success": true,
    "compressionRatio": "30.2",
    "originalSize": 20480,
    "processedSize": 14336,
    "exifRemoved": {
      "exifRemoved": true,
      "originalExifKeys": 15,
      "remainingExifKeys": 0
    }
  }
}
```

## 使用示例

### 前端上传代码

```javascript
import { assetsAPI } from './services/api.js';

const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'images');

  try {
    const response = await assetsAPI.upload(formData);
    
    // 检查是否有隐私问题被检测到
    if (response.data.privacyCheck?.hadSensitiveData) {
      console.warn('隐私问题已自动处理:', response.data.privacyCheck.issues);
    }
    
    // 显示处理结果
    if (response.data.imageProcessing?.metadataStripped) {
      console.log('图片元信息已成功移除');
      console.log(`文件大小减少: ${response.data.imageProcessing.compressionRatio}%`);
    }
    
    return response.data.file;
  } catch (error) {
    console.error('上传失败:', error);
  }
};
```

## 测试

### 运行测试脚本

```bash
# 测试图片处理功能
cd cms/server
node scripts/test-image-processing.js

# 测试上传API
node scripts/test-upload-api.js
```

### 测试用例

系统包含完整的测试用例，位于 `cms/server/test/imageProcessor.test.js`。

## 安全性说明

### 隐私保护级别

1. **完全移除**：所有EXIF、IPTC、XMP元数据
2. **GPS清理**：彻底移除地理位置信息
3. **设备信息清理**：移除相机/手机型号信息
4. **时间戳清理**：移除拍摄时间信息
5. **作者信息清理**：移除作者和版权信息

### 支持的格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- TIFF (.tiff, .tif)

### 处理流程

1. **上传检测**：检查文件格式和大小
2. **隐私扫描**：分析图片中的敏感信息
3. **元数据移除**：彻底清除所有元信息
4. **图片优化**：压缩和优化图片
5. **验证确认**：确保处理完成

## 日志记录

当启用日志记录时，系统会记录：

- 检测到的隐私问题
- 元信息移除结果
- 文件大小变化
- 处理时间和状态

```
Privacy issues detected in uploaded image photo.jpg: [
  'GPS location data found',
  'Camera/device information found'
]
Image processed: /path/to/photo.jpg
- Size: 2048000 → 1536000 bytes (25.0% reduction)
- EXIF removed: true (23 keys removed)
```

## 故障排除

### 常见问题

1. **处理失败**：检查图片格式是否支持
2. **文件过大**：调整 `maxFileSize` 配置
3. **质量问题**：调整 `quality` 参数
4. **性能问题**：考虑禁用 `optimizeForWeb`

### 错误处理

系统会优雅处理错误，即使元数据处理失败，文件上传仍会继续，确保用户体验不受影响。
