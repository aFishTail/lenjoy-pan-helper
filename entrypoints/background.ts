/**
 * Background Service Worker
 * 负责存储和跨页面功能
 */

export default defineBackground(() => {
  console.log('[Lenjoy Helper] Background script loaded', { id: browser.runtime.id });

  // 监听扩展安装/更新
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('[Lenjoy Helper] Extension installed');
    } else if (details.reason === 'update') {
      console.log('[Lenjoy Helper] Extension updated');
    }
  });
});
