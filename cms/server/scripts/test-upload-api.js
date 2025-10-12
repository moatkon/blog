#!/usr/bin/env node

/**
 * 测试文件上传API的脚本
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3001/api';

async function testUploadAPI() {
  console.log('=== Testing Upload API ===');
  
  // 使用之前创建的测试图片
  const testImagePath = path.join(__dirname, '../test-temp/test-image-with-exif.jpg');
  
  if (!await fs.pathExists(testImagePath)) {
    console.error('❌ Test image not found. Please run test-image-processing.js first.');
    return;
  }

  try {
    // 创建FormData
    const formData = new FormData();
    const fileBuffer = await fs.readFile(testImagePath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'test-image-with-exif.jpg');
    formData.append('folder', 'test-uploads');

    console.log('📤 Uploading test image...');
    
    // 发送上传请求
    const response = await fetch(`${API_BASE}/assets/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    // 检查响应中的图片处理信息
    if (result.imageProcessing) {
      console.log('\n--- Image Processing Results ---');
      console.log(`🗑️  Metadata stripped: ${result.imageProcessing.metadataStripped}`);
      console.log(`📉 Compression ratio: ${result.imageProcessing.compressionRatio}%`);
      console.log(`📁 Original size: ${(result.imageProcessing.originalSize / 1024).toFixed(2)} KB`);
      console.log(`📁 Processed size: ${(result.imageProcessing.processedSize / 1024).toFixed(2)} KB`);
    }

    if (result.privacyCheck) {
      console.log('\n--- Privacy Check Results ---');
      console.log(`🔍 Had sensitive data: ${result.privacyCheck.hadSensitiveData}`);
      console.log(`⚠️  Issues found: ${result.privacyCheck.issuesFound}`);
      if (result.privacyCheck.issues.length > 0) {
        console.log('📋 Issues:');
        result.privacyCheck.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
    }

    // 测试隐私检查API
    if (result.file && result.file.path) {
      console.log('\n--- Testing Privacy Check API ---');
      const privacyResponse = await fetch(`${API_BASE}/assets/privacy-check/${result.file.path}`);
      
      if (privacyResponse.ok) {
        const privacyResult = await privacyResponse.json();
        console.log('✅ Privacy check API successful!');
        console.log('📋 Privacy check result:', JSON.stringify(privacyResult, null, 2));
      } else {
        console.error('❌ Privacy check API failed:', privacyResponse.statusText);
      }
    }

  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
  }
}

async function main() {
  // 检查服务器是否运行
  try {
    const healthResponse = await fetch(`${API_BASE}/assets`);
    if (!healthResponse.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ CMS server is running');
  } catch (error) {
    console.error('❌ CMS server is not running. Please start it first with: npm start');
    return;
  }

  await testUploadAPI();
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
