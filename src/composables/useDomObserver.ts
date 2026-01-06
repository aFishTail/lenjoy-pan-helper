/**
 * DOM 监听器 - 监听夸克网盘文件列表变化，注入预览按钮
 */

import { SELECTORS, PREVIEW_BTN_CLASS } from '@/utils/constants';
import { injectStyles } from '@/utils/styles';
import previewIconSvg from '@/assets/icons/material-symbols--preview.svg?raw';

type PreviewCallback = (folderId: string, folderName: string) => void;

let observer: MutationObserver | null = null;
let urlObserver: MutationObserver | null = null;

// 自定义事件名称
const PREVIEW_EVENT = 'lenjoy-preview-folder';

/**
 * 创建预览按钮
 */
function createPreviewButton(folderId: string, folderName: string): HTMLElement {
    const button = document.createElement('div');
    button.className = `${PREVIEW_BTN_CLASS} hover-oper-item`;
    button.title = '预览全部文件';
    button.innerHTML = previewIconSvg;

    // 存储数据
    button.dataset.folderId = folderId;
    button.dataset.folderName = folderName;

    // 点击事件 - 使用自定义事件传递到 Shadow DOM
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        console.log('[Lenjoy Helper] Preview button clicked:', folderId, folderName);

        // 派发自定义事件到 window
        window.dispatchEvent(new CustomEvent(PREVIEW_EVENT, {
            detail: { folderId, folderName }
        }));
    });

    return button;
}

/**
 * 判断行是否为文件夹
 */
function isRowFolder(row: HTMLElement): boolean {
    const sizeCell = row.querySelector(SELECTORS.SIZE_CELL);
    return sizeCell?.textContent?.trim() === '-';
}

/**
 * 从行元素获取文件夹信息
 */
function getFolderInfo(row: HTMLElement): { folderId: string; folderName: string } | null {
    const folderId = row.getAttribute('data-row-key');
    const fileNameEl = row.querySelector(SELECTORS.FILE_NAME);
    const folderName = fileNameEl?.textContent?.trim() || '';

    if (!folderId || !folderName) return null;

    return { folderId, folderName };
}

/**
 * 为单个文件夹行注入预览按钮
 */
function injectPreviewButton(row: HTMLElement): void {
    // 检查是否已经注入
    if (row.querySelector(`.${PREVIEW_BTN_CLASS}`)) return;

    // 检查是否为文件夹
    if (!isRowFolder(row)) return;

    // 获取文件夹信息
    const folderInfo = getFolderInfo(row);
    if (!folderInfo) return;

    // 查找操作栏
    const operList = row.querySelector(SELECTORS.HOVER_OPER_LIST);
    if (!operList) return;

    // 查找 "更多" 按钮，在它前面插入
    const moreBtn = operList.querySelector('.hoitem-more');

    // 创建按钮
    const button = createPreviewButton(folderInfo.folderId, folderInfo.folderName);

    // 在 "更多" 按钮前插入，或者追加到末尾
    if (moreBtn) {
        operList.insertBefore(button, moreBtn);
    } else {
        operList.appendChild(button);
    }
}

/**
 * 处理文件列表变化
 */
function handleTableChange(tableBody: Element): void {
    const rows = tableBody.querySelectorAll<HTMLElement>(SELECTORS.FILE_ROW);
    rows.forEach(row => injectPreviewButton(row));
}

/**
 * 初始化 DOM 监听
 */
export function initDomObserver(callback: PreviewCallback): void {
    // 注入样式
    injectStyles();

    // 监听自定义事件（从主文档传递过来）
    window.addEventListener(PREVIEW_EVENT, ((e: CustomEvent) => {
        const { folderId, folderName } = e.detail;
        console.log('[Lenjoy Helper] Received preview event:', folderId, folderName);
        callback(folderId, folderName);
    }) as EventListener);

    // 创建 MutationObserver
    observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // 处理新增节点
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        // 检查是否是表格行
                        if (node.matches(SELECTORS.FILE_ROW)) {
                            injectPreviewButton(node);
                        }
                        // 检查子元素中的表格行
                        const rows = node.querySelectorAll<HTMLElement>(SELECTORS.FILE_ROW);
                        rows.forEach(row => injectPreviewButton(row));
                    }
                });
            }
        }
    });

    // 开始观察
    const startObserving = () => {
        const tableBody = document.querySelector(SELECTORS.FILE_TABLE);
        if (tableBody) {
            // 先处理已有的行
            handleTableChange(tableBody);

            // 开始监听变化
            observer?.observe(tableBody, {
                childList: true,
                subtree: true,
            });

            console.log('[Lenjoy Helper] DOM observer started');
        } else {
            // 表格还没加载，等待后重试
            setTimeout(startObserving, 500);
        }
    };

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    // 监听 URL 变化（夸克网盘是 SPA）
    let lastUrl = location.href;
    urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            // URL 变化后重新开始监听
            setTimeout(startObserving, 500);
        }
    });

    urlObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

/**
 * 销毁 DOM 监听
 */
export function destroyDomObserver(): void {
    observer?.disconnect();
    observer = null;
    urlObserver?.disconnect();
    urlObserver = null;
}
