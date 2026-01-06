/**
 * 夸克网盘 API 类型定义
 */

// 文件类型枚举
export enum QuarkFileType {
    FOLDER = 0,
    FILE = 1,
}

// 文件分类
export enum FileCategory {
    ALL = 'all',
    VIDEO = 'video',
    IMAGE = 'image',
    DOCUMENT = 'document',
    AUDIO = 'audio',
    ARCHIVE = 'archive',
    OTHER = 'other',
}

// 文件信息
export interface QuarkFile {
    fid: string;
    file_name: string;
    file_type: number; // 0: 文件夹, 1: 文件
    size: number;
    format_type: string;
    created_at: number;
    updated_at: number;
    pdir_fid: string;
    category: string;
    obj_category: string;
    // 扩展字段
    _path?: string; // 相对路径
    _depth?: number; // 目录深度
}

// API 响应
export interface QuarkApiResponse<T = any> {
    status: number;
    code: number;
    message: string;
    data: T;
    metadata?: {
        _total: number;
        _size: number;
        _page: number;
    };
}

// 文件列表响应数据
export interface FileListData {
    list: QuarkFile[];
}

// 获取文件列表参数
export interface GetFileListParams {
    pdir_fid: string;
    _page?: number;
    _size?: number;
    _sort?: string;
    _fetch_total?: number;
    _fetch_sub_dirs?: number;
}

// 消息类型
export interface BridgeMessage {
    type: string;
    requestId: string;
    payload?: any;
}

export interface ApiRequestMessage extends BridgeMessage {
    type: 'QUARK_API_REQUEST';
    payload: {
        url: string;
        options?: RequestInit;
    };
}

export interface ApiResponseMessage extends BridgeMessage {
    type: 'QUARK_API_RESPONSE';
    payload: {
        success: boolean;
        data?: any;
        error?: string;
    };
}
