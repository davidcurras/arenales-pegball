import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{main:resolve('index.html'),ranking:resolve('ranking.html'),admin:resolve('admin.html')},output:{manualChunks:{phaser:['phaser'],firebase:['firebase/app','firebase/auth','firebase/firestore']}}}},server:{host:'127.0.0.1'}});
