/**
 * 文件工具函数
 */

import { FILE_EXTENSIONS, EBOOK_EXTENSIONS } from './constants';

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * 格式化日期时间
 */
export function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * 根据文件名获取文件分类
 */
export function getFileCategory(filename: string): string {
    if (!filename) return 'other';
    const ext = getFileExtension(filename);

    for (const [category, extensions] of Object.entries(FILE_EXTENSIONS)) {
        if (extensions.includes(ext)) {
            return category;
        }
    }

    return 'other';
}

/**
 * 判断是否为文件夹
 */
export function isFolder(fileType: number): boolean {
    return fileType === 0;
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 判断是否为电子书格式
 */
export function isEbook(filename: string): boolean {
    const ext = getFileExtension(filename);
    return EBOOK_EXTENSIONS.includes(ext as typeof EBOOK_EXTENSIONS[number]);
}

/**
 * 获取不带扩展名的文件名
 */
export function getFileNameWithoutExt(filename: string): string {
    if (!filename) return '';
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}
