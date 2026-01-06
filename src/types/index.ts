export * from './quark';

// 侧边栏状态
export interface SidePanelState {
    visible: boolean;
    folderId: string;
    folderName: string;
    recursive: boolean;
}

// 筛选选项
export interface FilterOptions {
    category: string;
    searchKeyword: string;
    sizeRange: [number, number] | null;
}
