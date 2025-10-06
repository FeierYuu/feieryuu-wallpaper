#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 修复dist/index.html中的资源路径
function fixAssetPaths() {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ dist/index.html not found');
    return;
  }
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // 将绝对路径改为相对路径
  content = content.replace(/src="\/assets\//g, 'src="./assets/');
  content = content.replace(/href="\/assets\//g, 'href="./assets/');
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Fixed asset paths in dist/index.html');
}

// 运行修复
fixAssetPaths();
