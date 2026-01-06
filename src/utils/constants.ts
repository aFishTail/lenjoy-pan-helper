/**
 * 常量定义
 */

// 夸克 API 基础 URL
export const QUARK_API_BASE = 'https://drive-pc.quark.cn/1/clouddrive';

// 消息类型
export const MESSAGE_TYPES = {
    API_REQUEST: 'LENJOY_QUARK_API_REQUEST',
    API_RESPONSE: 'LENJOY_QUARK_API_RESPONSE',
} as const;

// DOM 选择器
export const SELECTORS = {
    FILE_TABLE: '.ant-table-tbody',
    FILE_ROW: 'tr.ant-table-row',
    HOVER_OPER_LIST: '.hover-oper-list',
    FILE_NAME: '.filename-text',
    SIZE_CELL: 'td:nth-child(3)',
} as const;

// 文件类型映射
export const FILE_CATEGORY_MAP: Record<string, string> = {
    video: '视频',
    image: '图片',
    doc: '文档',
    audio: '音频',
    archive: '压缩包',
    other: '其他',
} as const;

// 文件扩展名分类
export const FILE_EXTENSIONS: Record<string, string[]> = {
    video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'rmvb', 'rm', 'm4v', '3gp'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'psd'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'epub', 'mobi', 'azw3'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'ape'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
} as const;

// 电子书扩展名
export const EBOOK_EXTENSIONS = ['epub', 'mobi', 'azw3', 'pdf'] as const;

// 豆瓣搜索 URL
export const DOUBAN_BOOK_SEARCH_URL = 'https://search.douban.com/book/subject_search?search_text=';

// 插件唯一标识
export const PLUGIN_PREFIX = 'lenjoy-helper';

// 预览按钮类名
export const PREVIEW_BTN_CLASS = `${PLUGIN_PREFIX}-preview-btn`;
