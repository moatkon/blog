#!/usr/bin/env node

/**
 * Blog CMS 功能测试脚本
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';
const TEST_DATA = {
  post: {
    title: 'CMS测试文章',
    description: '这是一个测试文章',
    body: '# 测试内容\n\n这是通过CMS创建的测试文章。',
    draft: true,
    tags: ['测试', 'CMS'],
    pinned: false
  },
  note: {
    title: 'CMS测试笔记',
    description: '这是一个测试笔记',
    body: '这是通过CMS创建的测试笔记。'
  },
  tag: {
    name: 'cms-test',
    title: 'CMS测试',
    description: '用于测试CMS功能的标签',
    body: '这是一个测试标签。'
  }
};

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
}

async function runTests() {
  console.log('🧪 开始测试 Blog CMS 功能...\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const test = async (name, testFn) => {
    testResults.total++;
    try {
      await testFn();
      console.log(`✅ ${name}`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      testResults.failed++;
    }
  };
  
  // 测试服务器连接
  await test('服务器连接', async () => {
    const result = await testAPI('/posts');
    if (!result.success) {
      throw new Error('无法连接到CMS服务器');
    }
  });
  
  // 测试Posts API
  await test('获取Posts列表', async () => {
    const result = await testAPI('/posts');
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  await test('创建Post', async () => {
    const result = await testAPI('/posts', 'POST', TEST_DATA.post);
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  // 测试Notes API
  await test('获取Notes列表', async () => {
    const result = await testAPI('/notes');
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  await test('创建Note', async () => {
    const result = await testAPI('/notes', 'POST', TEST_DATA.note);
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  // 测试Tags API
  await test('获取Tags列表', async () => {
    const result = await testAPI('/tags');
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  await test('创建Tag', async () => {
    const result = await testAPI('/tags', 'POST', TEST_DATA.tag);
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  // 测试Assets API
  await test('获取Assets列表', async () => {
    const result = await testAPI('/assets');
    if (!result.success) {
      throw new Error(result.error);
    }
  });
  
  // 输出测试结果
  console.log('\n📊 测试结果:');
  console.log(`总计: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！CMS系统运行正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查CMS系统配置。');
  }
  
  return testResults.failed === 0;
}

// 检查服务器是否运行
async function checkServer() {
  console.log('🔍 检查CMS服务器状态...');
  
  try {
    await axios.get(`${API_BASE}/posts`, { timeout: 3000 });
    console.log('✅ CMS服务器正在运行\n');
    return true;
  } catch (error) {
    console.log('❌ CMS服务器未运行');
    console.log('请先启动CMS服务器：');
    console.log('  cd cms && npm run dev');
    console.log('  或者运行：./start.sh\n');
    return false;
  }
}

// 主函数
async function main() {
  console.log('Blog CMS 测试工具');
  console.log('==================\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  const success = await runTests();
  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
