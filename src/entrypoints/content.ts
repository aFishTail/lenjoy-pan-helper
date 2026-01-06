/**
 * Content Script 入口
 * 运行在夸克网盘页面的隔离世界
 */

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { pinia, useFileStore } from '@/stores';
import { initDomObserver } from '@/composables';
import App from '@/components/App.vue';

export default defineContentScript({
    matches: ['*://pan.quark.cn/*'],
    cssInjectionMode: 'ui',

    async main(ctx) {
        console.log('[Lenjoy Helper] Content script starting...');

        // 注入 Main World 脚本
        await injectMainWorldScript();

        // 创建 UI 容器
        const ui = await createShadowRootUi(ctx, {
            name: 'lenjoy-helper',
            position: 'inline',
            anchor: 'body',
            onMount: (container) => {
                // 创建挂载点
                const appRoot = document.createElement('div');
                appRoot.id = 'lenjoy-helper-root';
                container.append(appRoot);

                // 创建 Vue 应用
                const app = createApp(App);
                app.use(pinia);
                app.use(ElementPlus, { locale: zhCn });
                app.mount(appRoot);

                // 初始化 DOM 监听
                const fileStore = useFileStore(pinia);
                initDomObserver((folderId, folderName) => {
                    fileStore.openSidePanel(folderId, folderName);
                });

                console.log('[Lenjoy Helper] UI mounted');

                return app;
            },
            onRemove: (app) => {
                app?.unmount();
            },
        });

        // 挂载 UI
        ui.mount();
    },
});

/**
 * 注入 Main World 脚本
 */
async function injectMainWorldScript() {
    return new Promise<void>((resolve) => {
        // 检查是否已加载
        if ((window as any).__LENJOY_HELPER_LOADED__) {
            resolve();
            return;
        }

        // 创建 script 标签
        const script = document.createElement('script');
        script.src = browser.runtime.getURL('/injected.js');
        script.type = 'module';

        script.onload = () => {
            console.log('[Lenjoy Helper] Main world script injected');
            resolve();
        };

        script.onerror = (err) => {
            console.error('[Lenjoy Helper] Failed to inject main world script:', err);
            resolve(); // 即使失败也继续
        };

        (document.head || document.documentElement).appendChild(script);
    });
}
