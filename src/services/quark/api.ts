/**
 * 夸克网盘 API 封装
 */

import { sendApiRequest } from '../bridge';
import type { QuarkFile, QuarkApiResponse, FileListData, GetFileListParams } from '@/types';

const API_BASE = '/file/sort';

// API 通用参数
const COMMON_PARAMS = {
    pr: 'ucpro',
    fr: 'pc',
    uc_param_str: '',
};

/**
 * 构建 URL 参数
 */
function buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

/**
 * 获取文件列表
 */
export async function getFileList(params: GetFileListParams): Promise<QuarkApiResponse<FileListData>> {
    const queryParams = {
        ...COMMON_PARAMS,
        pdir_fid: params.pdir_fid,
        _page: params._page || 1,
        _size: params._size || 50,
        _fetch_total: params._fetch_total ?? 1,
        _fetch_sub_dirs: params._fetch_sub_dirs ?? 0,
        _sort: params._sort || 'file_type:asc,updated_at:desc',
        fetch_all_file: 1,
        fetch_risk_file_name: 1,
    };

    const url = `${API_BASE}?${buildQueryString(queryParams)}`;

    return sendApiRequest(url);
}

/**
 * 延迟配置类型
 */
export interface DelayConfig {
    min: number;
    max: number;
    enabled: boolean;
}

/**
 * 随机延迟（模拟正常用户操作）
 */
function randomDelay(config?: DelayConfig): Promise<void> {
    if (!config || !config.enabled) {
        return Promise.resolve();
    }
    const delay = Math.random() * (config.max - config.min) + config.min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 递归获取文件夹下所有文件
 */
export async function getAllFilesRecursive(
    folderId: string,
    options: {
        onProgress?: (loaded: number, total: number) => void;
        onFiles?: (files: QuarkFile[]) => void; // 实时返回新文件
        path?: string;
        depth?: number;
        delay?: DelayConfig;
        signal?: { cancelled: boolean }; // 取消信号
    } = {}
): Promise<QuarkFile[]> {
    const { onProgress, onFiles, path = '', depth = 0, delay, signal } = options;
    const allFiles: QuarkFile[] = [];
    let page = 1;
    let total = 0;
    let hasMore = true;

    // 获取当前文件夹的所有文件
    while (hasMore) {
        // 检查是否已取消
        if (signal?.cancelled) {
            console.log('[Lenjoy Helper] Recursive fetch cancelled');
            return allFiles;
        }

        // 添加随机延迟（首次请求除外）
        if (page > 1 || depth > 0) {
            await randomDelay(delay);
        }

        // 再次检查是否已取消（延迟后）
        if (signal?.cancelled) {
            console.log('[Lenjoy Helper] Recursive fetch cancelled after delay');
            return allFiles;
        }

        const response = await getFileList({
            pdir_fid: folderId,
            _page: page,
            _size: 50,
        });

        if (response.code !== 0 || !response.data?.list) {
            throw new Error(response.message || 'Failed to fetch file list');
        }

        const { list } = response.data;
        const { _total = 0 } = response.metadata || {};

        if (page === 1) {
            total = _total;
        }

        // 本次请求获取的文件（用于实时回调）
        const newFiles: QuarkFile[] = [];

        // 处理文件列表
        for (const file of list) {
            // 检查是否已取消
            if (signal?.cancelled) {
                return allFiles;
            }

            // 添加路径和深度信息
            const fileWithPath: QuarkFile = {
                ...file,
                _path: path ? `${path}/${file.file_name}` : file.file_name,
                _depth: depth,
            };

            // 如果是文件夹，递归获取
            if (file.file_type === 0) {
                // 文件夹不加入列表，但需要递归获取其内容
                // 递归前添加延迟
                await randomDelay(delay);
                const subFiles = await getAllFilesRecursive(file.fid, {
                    onProgress,
                    onFiles, // 传递实时回调
                    path: fileWithPath._path,
                    depth: depth + 1,
                    delay,
                    signal, // 传递取消信号
                });
                allFiles.push(...subFiles);
            } else {
                allFiles.push(fileWithPath);
                newFiles.push(fileWithPath);
            }
        }

        // 实时返回新文件
        if (onFiles && newFiles.length > 0) {
            onFiles(newFiles);
        }

        // 检查是否还有更多
        hasMore = list.length === 50;
        page++;

        // 报告进度
        if (onProgress) {
            onProgress(allFiles.length, total);
        }
    }

    return allFiles;
}

/**
 * 获取单层文件列表（不递归）
 * 同时显示文件和文件夹
 */
export async function getFilesFlat(folderId: string): Promise<QuarkFile[]> {
    const allFiles: QuarkFile[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await getFileList({
            pdir_fid: folderId,
            _page: page,
            _size: 50,
        });

        if (response.code !== 0 || !response.data?.list) {
            throw new Error(response.message || 'Failed to fetch file list');
        }

        const { list } = response.data;

        // 添加所有文件和文件夹
        for (const file of list) {
            allFiles.push({
                ...file,
                _path: file.file_name,
                _depth: 0,
            });
        }

        hasMore = list.length === 50;
        page++;
    }

    return allFiles;
}

/**
 * 获取文件下载链接
 */
export async function getDownloadUrl(fid: string): Promise<string> {
    const url = `/file/download?${buildQueryString(COMMON_PARAMS)}`;

    const response = await sendApiRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fids: [fid] }),
    });

    if (response.code !== 0 || !response.data?.[0]?.download_url) {
        throw new Error(response.message || 'Failed to get download URL');
    }

    return response.data[0].download_url;
}
