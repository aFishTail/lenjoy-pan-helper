/**
 * 注入到页面的样式
 */

// 预览按钮样式
export const INJECTED_STYLES = `
/* Lenjoy Helper - 预览按钮样式 */
.lenjoy-helper-preview-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  vertical-align: middle;
}

.lenjoy-helper-preview-btn:hover {
  transform: scale(1.1);
}

.lenjoy-helper-preview-btn svg {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
`;

/**
 * 注入样式到页面
 */
export function injectStyles(): void {
    const styleId = 'lenjoy-helper-styles';

    // 避免重复注入
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = INJECTED_STYLES;
    document.head.appendChild(style);
}
