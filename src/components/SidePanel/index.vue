<template>
  <Transition name="slide">
    <div v-if="fileStore.sidePanelVisible" class="lenjoy-side-panel">
      <!-- 遮罩层 -->
      <div class="panel-mask" @click="handleClose"></div>

      <!-- 侧边栏内容 -->
      <div class="panel-content">
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <el-icon class="folder-icon"><Folder /></el-icon>
            <span class="folder-name" :title="fileStore.currentFolderName">
              {{ fileStore.currentFolderName }}
            </span>
            <span class="file-count">
              {{ fileStore.statistics.filtered }} 个文件
            </span>
          </div>
          <el-button
            type="default"
            :icon="Close"
            circle
            size="small"
            @click="handleClose"
          />
        </div>

        <!-- 工具栏 -->
        <div class="panel-toolbar">
          <!-- 递归选项 -->
          <div class="toolbar-left">
            <el-button
              size="small"
              type="primary"
              :loading="fileStore.loading && fileStore.recursive"
              :disabled="fileStore.loading"
              @click="handleLoadSubfolders"
            >
              📂 加载子文件夹
            </el-button>
            <el-button
              size="small"
              text
              type="primary"
              @click="delayConfigVisible = !delayConfigVisible"
            >
              ⚙️ 请求频率
            </el-button>
          </div>

          <!-- 延迟配置面板 -->
          <div v-if="delayConfigVisible" class="delay-config-panel">
            <div class="delay-config-header">
              <span>请求频率控制</span>
              <el-button
                size="small"
                :icon="Close"
                circle
                @click="delayConfigVisible = false"
              />
            </div>
            <div class="delay-config">
              <div class="delay-config-item">
                <el-checkbox v-model="delayEnabled" @change="handleDelayChange">
                  启用请求延迟
                </el-checkbox>
              </div>
              <div v-if="delayEnabled" class="delay-config-item">
                <span class="label">最小延迟 (秒):</span>
                <el-slider
                  v-model="delayMin"
                  :min="0"
                  :max="5"
                  :step="0.1"
                  :show-tooltip="true"
                  @change="handleDelayChange"
                />
                <span class="value">{{ delayMin }}s</span>
              </div>
              <div v-if="delayEnabled" class="delay-config-item">
                <span class="label">最大延迟 (秒):</span>
                <el-slider
                  v-model="delayMax"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  :show-tooltip="true"
                  @change="handleDelayChange"
                />
                <span class="value">{{ delayMax }}s</span>
              </div>
              <div v-if="delayEnabled" class="delay-tip">
                每次请求将随机等待 {{ delayMin }}-{{ delayMax }} 秒
              </div>
            </div>
          </div>

          <!-- 筛选器 -->
          <div class="toolbar-right">
            <el-select
              v-model="filterCategory"
              placeholder="文件类型"
              size="small"
              style="width: 100px"
              @change="handleFilterChange"
            >
              <el-option label="全部" value="all" />
              <el-option label="视频" value="video" />
              <el-option label="图片" value="image" />
              <el-option label="文档" value="document" />
              <el-option label="音频" value="audio" />
              <el-option label="压缩包" value="archive" />
              <el-option label="其他" value="other" />
            </el-select>

            <el-input
              v-model="searchKeyword"
              placeholder="搜索文件名"
              size="small"
              style="width: 150px"
              clearable
              :prefix-icon="Search"
              @input="handleSearchChange"
            />
          </div>
        </div>

        <!-- 加载进度条（递归时显示在顶部） -->
        <div
          v-if="fileStore.loading && fileStore.files.length > 0"
          class="panel-loading-bar"
        >
          <el-progress
            :percentage="loadingProgress"
            :stroke-width="4"
            :show-text="false"
          />
          <span class="loading-text">
            正在加载... 已获取 {{ fileStore.files.length }} 个文件
          </span>
          <el-button size="small" type="danger" @click="handleStopLoading">
            停止
          </el-button>
        </div>

        <!-- 初始加载状态（无文件时） -->
        <div
          v-if="fileStore.loading && fileStore.files.length === 0"
          class="panel-loading"
        >
          <el-progress
            :percentage="loadingProgress"
            :stroke-width="6"
            :show-text="true"
          />
          <span class="loading-text">
            正在加载... {{ fileStore.progress.loaded }} 个文件
          </span>
          <el-button
            v-if="fileStore.recursive"
            size="small"
            type="danger"
            @click="handleStopLoading"
          >
            停止加载
          </el-button>
        </div>

        <!-- 错误提示 -->
        <div v-else-if="fileStore.error" class="panel-error">
          <el-result icon="error" title="加载失败" :sub-title="fileStore.error">
            <template #extra>
              <el-button type="primary" @click="handleRetry">重试</el-button>
            </template>
          </el-result>
        </div>

        <!-- 空状态 -->
        <div
          v-else-if="!fileStore.loading && fileStore.filteredFiles.length === 0"
          class="panel-empty"
        >
          <el-empty description="暂无文件" />
        </div>

        <!-- 文件列表 -->
        <div v-if="fileStore.filteredFiles.length > 0" class="panel-body">
          <el-table
            :data="paginatedFiles"
            height="100%"
            stripe
            size="small"
            :default-sort="{ prop: 'file_name', order: 'ascending' }"
          >
            <el-table-column
              prop="file_name"
              label="文件名"
              sortable
              min-width="200"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <div class="file-name-cell">
                  <span class="file-icon">{{ getFileIcon(row) }}</span>
                  <span class="file-name">{{ row.file_name }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column
              prop="size"
              label="大小"
              sortable
              width="100"
              align="right"
            >
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>

            <el-table-column
              prop="_path"
              label="路径"
              sortable
              width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span class="file-path">{{ getDisplayPath(row._path) }}</span>
              </template>
            </el-table-column>

            <el-table-column
              prop="updated_at"
              label="修改时间"
              sortable
              width="130"
            >
              <template #default="{ row }">
                {{ formatDateTime(row.updated_at) }}
              </template>
            </el-table-column>

            <el-table-column
              label="操作"
              width="120"
              align="center"
              fixed="right"
            >
              <template #default="{ row }">
                <template v-if="row.file_type !== 0">
                  <el-space style="width: 100%">
                    <el-button
                      size="small"
                      type="primary"
                      link
                      :loading="downloadingId === row.fid"
                      @click="handleDownload(row)"
                    >
                      下载
                    </el-button>
                    <el-button
                      v-if="isEbook(row.file_name)"
                      size="small"
                      type="warning"
                      link
                      @click="handleSearchDouban(row)"
                    >
                      豆瓣
                    </el-button>
                  </el-space>
                </template>
                <span v-else class="folder-hint">文件夹</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页器 -->
          <div v-if="totalFiles > pageSize" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="totalFiles"
              layout="prev, pager, next, jumper"
              size="small"
              background
            />
          </div>
        </div>

        <!-- 底部统计 -->
        <div class="panel-footer">
          <span class="stat-item">
            共 {{ fileStore.statistics.total }} 个文件
          </span>
          <span
            v-if="fileStore.statistics.filtered !== fileStore.statistics.total"
            class="stat-item"
          >
            筛选后 {{ fileStore.statistics.filtered }} 个
          </span>
          <span class="stat-item">
            总大小 {{ formatFileSize(fileStore.statistics.totalSize) }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Folder, Close, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useFileStore } from "@/stores";
import { getDownloadUrl } from "@/services/quark";
import {
  formatFileSize,
  formatDateTime,
  getFileCategory,
  isEbook,
  getFileNameWithoutExt,
} from "@/utils/file";
import { DOUBAN_BOOK_SEARCH_URL } from "@/utils/constants";
import { FILE_CATEGORY_MAP } from "@/utils/constants";

const fileStore = useFileStore();

// 本地状态
const filterCategory = ref("all");
const searchKeyword = ref("");
const delayConfigVisible = ref(false);
const downloadingId = ref<string | null>(null);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(100);

// 延迟配置状态
const delayEnabled = ref(fileStore.delayConfig.enabled);
const delayMin = ref(fileStore.delayConfig.min / 1000); // 转换为秒
const delayMax = ref(fileStore.delayConfig.max / 1000); // 转换为秒

// 计算加载进度
const loadingProgress = computed(() => {
  if (fileStore.progress.total === 0) return 0;
  return Math.round(
    (fileStore.progress.loaded / fileStore.progress.total) * 100
  );
});

// 分页后的文件列表
const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return fileStore.filteredFiles.slice(start, end);
});

// 总页数
const totalFiles = computed(() => fileStore.filteredFiles.length);

// 监听侧边栏打开，重置状态
watch(
  () => fileStore.sidePanelVisible,
  (visible) => {
    if (visible) {
      filterCategory.value = "all";
      searchKeyword.value = "";
      currentPage.value = 1;
      fileStore.resetFilter();
      // 同步延迟配置
      delayEnabled.value = fileStore.delayConfig.enabled;
      delayMin.value = fileStore.delayConfig.min / 1000;
      delayMax.value = fileStore.delayConfig.max / 1000;
    }
  }
);

// 获取文件图标
function getFileIcon(file: any): string {
  // 如果是文件夹
  if (file.file_type === 0) {
    return "📁";
  }
  const filename = file.file_name || "";
  const category = getFileCategory(filename);
  const icons: Record<string, string> = {
    video: "🎬",
    image: "🖼️",
    document: "📄",
    audio: "🎵",
    archive: "📦",
    other: "📎",
  };
  return icons[category] || "📄";
}

// 获取显示路径
function getDisplayPath(path: string): string {
  if (!path) return "/";
  const parts = path.split("/");
  parts.pop(); // 移除文件名
  return "/" + parts.join("/") || "/";
}

// 事件处理
function handleClose() {
  fileStore.closeSidePanel();
}

function handleLoadSubfolders() {
  // 触发递归加载子文件夹
  fileStore.loadFiles(
    fileStore.currentFolderId,
    fileStore.currentFolderName,
    true
  );
}

function handleFilterChange(value: string) {
  currentPage.value = 1;
  fileStore.setFilter({ category: value });
}

function handleSearchChange(value: string) {
  currentPage.value = 1;
  fileStore.setFilter({ searchKeyword: value });
}

function handleRetry() {
  fileStore.loadFiles(
    fileStore.currentFolderId,
    fileStore.currentFolderName,
    fileStore.recursive
  );
}

function handleStopLoading() {
  fileStore.stopLoading();
}

function handleDelayChange() {
  // 确保 min <= max
  if (delayMin.value > delayMax.value) {
    delayMax.value = delayMin.value;
  }
  fileStore.setDelayConfig({
    enabled: delayEnabled.value,
    min: Math.round(delayMin.value * 1000), // 转换为毫秒
    max: Math.round(delayMax.value * 1000), // 转换为毫秒
  });
}

// 下载文件
async function handleDownload(file: any) {
  if (downloadingId.value) return;

  try {
    downloadingId.value = file.fid;
    const downloadUrl = await getDownloadUrl(file.fid);

    // 打开下载链接
    window.open(downloadUrl, "_blank");
  } catch (err) {
    console.error("[Lenjoy Helper] Download error:", err);
    ElMessage.error("获取下载链接失败");
  } finally {
    downloadingId.value = null;
  }
}

// 搜索豆瓣
function handleSearchDouban(file: any) {
  const bookName = getFileNameWithoutExt(file.file_name);
  const searchUrl = DOUBAN_BOOK_SEARCH_URL + encodeURIComponent(bookName);
  window.open(searchUrl, "_blank");
}
</script>

<style lang="scss" scoped>
.lenjoy-side-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  justify-content: flex-end;
}

.panel-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.panel-content {
  position: relative;
  width: 500px;
  max-width: 90vw;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;

    .folder-icon {
      font-size: 20px;
      color: #0d53ff;
      flex-shrink: 0;
    }

    .folder-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-count {
      font-size: 12px;
      color: #909399;
      flex-shrink: 0;
    }
  }
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  position: relative;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// 延迟配置面板
.delay-config-panel {
  position: absolute;
  top: 100%;
  left: 20px;
  z-index: 100;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  padding: 12px 8px;

  .delay-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ed;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
}

// 递归加载时的顶部进度条
.panel-loading-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background-color: #ecf5ff;
  border-bottom: 1px solid #b3d8ff;

  .el-progress {
    flex: 1;
  }

  .loading-text {
    font-size: 12px;
    color: #409eff;
    white-space: nowrap;
  }
}

.panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  gap: 16px;

  .el-progress {
    width: 80%;
  }

  .loading-text {
    font-size: 14px;
    color: #606266;
  }
}

.panel-error,
.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
}

.panel-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-table) {
    flex: 1;
  }

  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .file-icon {
      font-size: 14px;
    }

    .file-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .file-path {
    font-size: 12px;
    color: #909399;
  }

  .folder-hint {
    font-size: 12px;
    color: #c0c4cc;
  }
}

.panel-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #f5f7fa;

  .stat-item {
    font-size: 12px;
    color: #606266;
  }
}

// 分页器
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
  flex-shrink: 0;
}

// 延迟配置弹窗
.delay-config {
  padding: 16px;

  .delay-config-item {
    margin-bottom: 12px;

    .label {
      display: block;
      font-size: 12px;
      color: #606266;
      margin-bottom: 4px;
    }

    .value {
      font-size: 12px;
      color: #909399;
      margin-left: 8px;
    }

    :deep(.el-slider) {
      display: inline-block;
      width: 160px;
      vertical-align: middle;
    }
  }

  .delay-tip {
    font-size: 11px;
    color: #909399;
    background-color: #f5f7fa;
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 8px;
  }
}

// 滑动动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;

  .panel-mask {
    transition: opacity 0.3s ease;
  }

  .panel-content {
    transition: transform 0.3s ease;
  }
}

.slide-enter-from,
.slide-leave-to {
  .panel-mask {
    opacity: 0;
  }

  .panel-content {
    transform: translateX(100%);
  }
}
</style>
