<template>
  <div
    class="lenjoy-float-button"
    :style="buttonStyle"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <span class="float-button-text">乐享</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useFileStore } from "@/stores";

const fileStore = useFileStore();

// 按钮位置（可拖拽）- 默认右上角
const position = ref({ x: window.innerWidth - 70, y: 20 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const hasMoved = ref(false);

// 存储位置的 key
const POSITION_KEY = "lenjoy-float-button-position";

// 从 localStorage 读取位置
onMounted(() => {
  try {
    const stored = localStorage.getItem(POSITION_KEY);
    if (stored) {
      const pos = JSON.parse(stored);
      position.value = pos;
    }
  } catch (e) {
    console.error("[Lenjoy Helper] Failed to load float button position:", e);
  }
});

// 保存位置到 localStorage
function savePosition() {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position.value));
  } catch (e) {
    console.error("[Lenjoy Helper] Failed to save float button position:", e);
  }
}

const buttonStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}));

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true;
  hasMoved.value = false;
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  hasMoved.value = true;
  const newX = e.clientX - dragStart.value.x;
  const newY = e.clientY - dragStart.value.y;

  // 限制在窗口范围内
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - 50, newX)),
    y: Math.max(0, Math.min(window.innerHeight - 40, newY)),
  };
}

function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  if (hasMoved.value) {
    savePosition();
  }
}

function handleClick() {
  // 如果拖拽过，不触发点击
  if (hasMoved.value) {
    hasMoved.value = false;
    return;
  }
  fileStore.toggleSidePanel();
}

onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});
</script>

<style lang="scss" scoped>
.lenjoy-float-button {
  position: fixed;
  z-index: 2147483646;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }

  .float-button-text {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1px;
  }
}
</style>
