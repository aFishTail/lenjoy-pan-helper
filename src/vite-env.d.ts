/// <reference types="vite/client" />

// SVG 文件作为原始字符串导入
declare module '*.svg?raw' {
    const content: string;
    export default content;
}

// SVG 文件作为 URL 导入
declare module '*.svg' {
    const url: string;
    export default url;
}
