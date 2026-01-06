import { defineConfig } from 'wxt';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  // 开发模式：不自动打开浏览器，需要手动加载扩展
  runner: {
    disabled: true,
  },
  manifest: {
    name: 'Lenjoy Browser Helper',
    description: '夸克网盘增强工具 - 预览文件夹内所有文件',
    version: '1.0.0',
    permissions: ['storage'],
    host_permissions: ['*://pan.quark.cn/*', '*://drive-pc.quark.cn/*'],
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['*://pan.quark.cn/*'],
      },
    ],
  },
  vite: () => ({
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }),
});
