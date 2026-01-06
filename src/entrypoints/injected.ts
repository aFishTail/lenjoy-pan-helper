/**
 * Main World 脚本 (Unlisted Script)
 * 运行在页面主世界，负责调用夸克 API
 * 请求 Origin 为 https://pan.quark.cn，Cookie 自动携带
 */

export default defineUnlistedScript(() => {
    // 常量
    const MESSAGE_TYPES = {
        API_REQUEST: 'LENJOY_QUARK_API_REQUEST',
        API_RESPONSE: 'LENJOY_QUARK_API_RESPONSE',
    };

    const QUARK_API_BASE = 'https://drive-pc.quark.cn/1/clouddrive';

    // 保存原始 fetch 引用，防止被页面重写
    const originalFetch = window.fetch.bind(window);

    // 消息处理器
    function handleMessage(event: MessageEvent) {
        // 只处理来自当前页面的消息
        if (event.source !== window) return;

        const { type, requestId, payload } = event.data || {};

        if (type !== MESSAGE_TYPES.API_REQUEST) return;

        // 执行 API 请求
        executeApiRequest(requestId, payload);
    }

    // 执行 API 请求
    async function executeApiRequest(requestId: string, payload: { url: string; options?: RequestInit }) {
        try {
            const { url, options = {} } = payload;

            // 构建完整 URL
            const fullUrl = url.startsWith('http') ? url : `${QUARK_API_BASE}${url}`;

            // 发起请求
            const response = await originalFetch(fullUrl, {
                ...options,
                credentials: 'include', // 确保携带 Cookie
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const data = await response.json();

            // 发送响应
            window.postMessage({
                type: MESSAGE_TYPES.API_RESPONSE,
                requestId,
                payload: {
                    success: true,
                    data,
                },
            }, '*');
        } catch (error) {
            // 发送错误响应
            window.postMessage({
                type: MESSAGE_TYPES.API_RESPONSE,
                requestId,
                payload: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            }, '*');
        }
    }

    // 注册消息监听器
    window.addEventListener('message', handleMessage);

    // 标记脚本已加载
    (window as any).__LENJOY_HELPER_LOADED__ = true;

    console.log('[Lenjoy Helper] Main world script loaded');
});
