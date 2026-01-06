/**
 * Content Script 与 Main World 的通信桥接
 */

import { MESSAGE_TYPES } from '@/utils/constants';
import { generateId } from '@/utils/file';

type RequestCallback = (response: { success: boolean; data?: any; error?: string }) => void;

// 存储待处理的请求回调
const pendingRequests = new Map<string, RequestCallback>();

// 监听来自 Main World 的响应
function setupResponseListener() {
    console.log('[Lenjoy Helper Bridge] Setting up response listener');
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        const { type, requestId, payload } = event.data || {};

        // 调试日志
        if (type && type.includes('LENJOY')) {
            console.log('[Lenjoy Helper Bridge] Received message:', type, requestId);
        }

        if (type !== MESSAGE_TYPES.API_RESPONSE) return;

        const callback = pendingRequests.get(requestId);
        console.log('[Lenjoy Helper Bridge] Callback found:', !!callback, 'payload:', payload);
        if (callback) {
            callback(payload);
            pendingRequests.delete(requestId);
        }
    });
}

// 初始化监听器
setupResponseListener();

/**
 * 向 Main World 发送 API 请求
 */
export function sendApiRequest(url: string, options?: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestId = generateId();

        // 设置超时
        const timeout = setTimeout(() => {
            pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
        }, 30000);

        // 注册回调
        pendingRequests.set(requestId, (response) => {
            clearTimeout(timeout);
            if (response.success) {
                resolve(response.data);
            } else {
                reject(new Error(response.error || 'Unknown error'));
            }
        });

        // 发送请求到 Main World
        window.postMessage({
            type: MESSAGE_TYPES.API_REQUEST,
            requestId,
            payload: { url, options },
        }, '*');
    });
}
