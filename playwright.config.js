import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',timeout:60000,expect:{timeout:12000},workers:1,reporter:[['list'],['html',{open:'never'}]],use:{baseURL:'http://127.0.0.1:5173',...devices['iPhone 13'],defaultBrowserType:'chromium',screenshot:'only-on-failure'},projects:[{name:'chromium-mobile',use:{browserName:'chromium'}}]});
