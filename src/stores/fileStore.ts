/**
 * 文件列表状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { QuarkFile, FilterOptions } from '@/types';
import { getFilesFlat, getAllFilesRecursive } from '@/services/quark';
import { getFileCategory } from '@/utils/file';

// 延迟配置存储 key
const DELAY_CONFIG_KEY = 'lenjoy-helper-delay-config';

// 从 localStorage 读取延迟配置
function loadDelayConfig() {
    try {
        const stored = localStorage.getItem(DELAY_CONFIG_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('[Lenjoy Helper] Failed to load delay config:', e);
    }
    return { min: 500, max: 2000, enabled: true };
}

// 保存延迟配置到 localStorage
function saveDelayConfig(config: { min: number; max: number; enabled: boolean }) {
    try {
        localStorage.setItem(DELAY_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('[Lenjoy Helper] Failed to save delay config:', e);
    }
}

export const useFileStore = defineStore('file', () => {
    // 状态
    const files = ref<QuarkFile[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const progress = ref({ loaded: 0, total: 0 });

    // 侧边栏状态
    const sidePanelVisible = ref(false);
    const currentFolderId = ref('');
    const currentFolderName = ref('');
    const recursive = ref(false);

    // 取消信号（用于停止递归请求）
    const cancelSignal = ref<{ cancelled: boolean } | null>(null);

    // 请求延迟配置（毫秒）- 从 localStorage 读取
    const delayConfig = ref(loadDelayConfig());

    // 监听延迟配置变化，自动保存
    watch(delayConfig, (newConfig) => {
        saveDelayConfig(newConfig);
    }, { deep: true });

    // 筛选选项
    const filterOptions = ref<FilterOptions>({
        category: 'all',
        searchKeyword: '',
        sizeRange: null,
    });

    // 计算属性：筛选后的文件列表
    const filteredFiles = computed(() => {
        let result = [...files.value];

        // 按分类筛选
        if (filterOptions.value.category !== 'all') {
            result = result.filter(file => {
                const category = getFileCategory(file.file_name);
                return category === filterOptions.value.category;
            });
        }

        // 按关键词搜索
        if (filterOptions.value.searchKeyword) {
            const keyword = filterOptions.value.searchKeyword.toLowerCase();
            result = result.filter(file =>
                file.file_name.toLowerCase().includes(keyword)
            );
        }

        // 按大小范围筛选
        if (filterOptions.value.sizeRange) {
            const [min, max] = filterOptions.value.sizeRange;
            result = result.filter(file =>
                file.size >= min && file.size <= max
            );
        }

        return result;
    });

    // 统计信息
    const statistics = computed(() => {
        const total = files.value.length;
        const filtered = filteredFiles.value.length;
        const totalSize = filteredFiles.value.reduce((sum, file) => sum + file.size, 0);

        return { total, filtered, totalSize };
    });

    // 追加文件到列表（用于实时更新）
    function appendFiles(newFiles: QuarkFile[]) {
        files.value = [...files.value, ...newFiles];
    }

    // 操作方法
    async function loadFiles(folderId: string, folderName: string, isRecursive: boolean = false) {
        console.log('[Lenjoy Helper] loadFiles called:', folderId, folderName, isRecursive);

        // 取消之前的请求
        if (cancelSignal.value) {
            cancelSignal.value.cancelled = true;
        }

        loading.value = true;
        error.value = null;
        files.value = [];
        progress.value = { loaded: 0, total: 0 };

        currentFolderId.value = folderId;
        currentFolderName.value = folderName;
        recursive.value = isRecursive;

        // 创建新的取消信号
        const signal = { cancelled: false };
        cancelSignal.value = signal;

        try {
            if (isRecursive) {
                await getAllFilesRecursive(folderId, {
                    onProgress: (loaded, total) => {
                        // 检查是否已取消
                        if (signal.cancelled) return;
                        progress.value = { loaded, total };
                    },
                    onFiles: (newFiles) => {
                        // 检查是否已取消
                        if (signal.cancelled) return;
                        // 实时追加新文件到列表
                        appendFiles(newFiles);
                    },
                    delay: delayConfig.value.enabled ? delayConfig.value : undefined,
                    signal,
                });
            } else {
                files.value = await getFilesFlat(folderId);
            }
            if (!signal.cancelled) {
                console.log('[Lenjoy Helper] Files loaded:', files.value.length, files.value);
            }
        } catch (err) {
            // 如果是取消导致的，不显示错误
            if (!signal.cancelled) {
                error.value = err instanceof Error ? err.message : 'Failed to load files';
                console.error('[Lenjoy Helper] Load files error:', err);
            }
        } finally {
            // 只有当前信号未被取消时才设置 loading 为 false
            if (!signal.cancelled) {
                loading.value = false;
            }
        }
    }

    // 停止递归加载
    function stopLoading() {
        console.log('[Lenjoy Helper] stopLoading called, cancelSignal:', cancelSignal.value);
        if (cancelSignal.value) {
            cancelSignal.value.cancelled = true;
            console.log('[Lenjoy Helper] Signal cancelled set to true');
        }
        loading.value = false;
        console.log('[Lenjoy Helper] Loading stopped by user');
    }

    function openSidePanel(folderId: string, folderName: string) {
        console.log('[Lenjoy Helper] Opening side panel:', folderId, folderName);
        sidePanelVisible.value = true;
        console.log('[Lenjoy Helper] sidePanelVisible:', sidePanelVisible.value);
        // 默认不递归，只加载当前文件夹
        loadFiles(folderId, folderName, false);
    }

    function closeSidePanel() {
        sidePanelVisible.value = false;
        // 不清空文件列表，保留上次查询结果
    }

    // 切换侧边栏显示（不重新加载数据）
    function toggleSidePanel() {
        sidePanelVisible.value = !sidePanelVisible.value;
    }

    function setRecursive(value: boolean) {
        recursive.value = value;
        if (currentFolderId.value) {
            loadFiles(currentFolderId.value, currentFolderName.value, value);
        }
    }

    function setFilter(options: Partial<FilterOptions>) {
        filterOptions.value = { ...filterOptions.value, ...options };
    }

    function resetFilter() {
        filterOptions.value = {
            category: 'all',
            searchKeyword: '',
            sizeRange: null,
        };
    }

    function setDelayConfig(config: Partial<typeof delayConfig.value>) {
        delayConfig.value = { ...delayConfig.value, ...config };
    }

    return {
        // 状态
        files,
        loading,
        error,
        progress,
        sidePanelVisible,
        currentFolderId,
        currentFolderName,
        recursive,
        filterOptions,
        delayConfig,
        // 计算属性
        filteredFiles,
        statistics,
        // 方法
        loadFiles,
        openSidePanel,
        closeSidePanel,
        toggleSidePanel,
        setRecursive,
        setFilter,
        resetFilter,
        setDelayConfig,
        stopLoading,
    };
});
