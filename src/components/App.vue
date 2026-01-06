<template>
  <FloatButton />
  <SidePanel />
</template>

<script setup lang="ts">
import SidePanel from "@/components/SidePanel/index.vue";
import FloatButton from "@/components/FloatButton/index.vue";
</script>

<style lang="scss">
// 全局样式隔离
#lenjoy-helper-root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;

  // 确保容器可以显示 fixed 元素
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 2147483647; // 最大 z-index
  pointer-events: none;

  * {
    box-sizing: border-box;
  }

  // 侧边栏和悬浮按钮需要可以交互
  .lenjoy-side-panel,
  .lenjoy-float-button {
    pointer-events: auto;
  }
}
</style>
