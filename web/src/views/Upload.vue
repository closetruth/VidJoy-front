<template>
  <div class="upload-page container">
    <h1 class="page-title">投稿中心</h1>
    <div class="upload-card">
      <p class="upload-hint">视频上传功能需要连接后端服务，请确保后端已启动（localhost:7071）</p>

      <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="onDrop">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--bili-pink)">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <p>点击或拖拽视频文件到此处上传</p>
        <p class="sub">支持 MP4、FLV 等常见格式</p>
        <input ref="fileInput" type="file" accept="video/*" hidden @change="onFileSelect" />
      </div>

      <div v-if="uploading" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }" />
        </div>
        <p>
          上传中 {{ progress }}%（分片 {{ uploadingChunkIndex + 1 }}/{{ chunksTotal }}）
        </p>
      </div>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <div v-if="uploadComplete" class="result-card">
        <h2>上传完成</h2>
        <div class="result-item">
          <span>文件名</span>
          <strong>{{ uploadedFileName }}</strong>
        </div>
        <div class="result-item">
          <span>上传标识</span>
          <code>{{ uploadId }}</code>
        </div>
        <div class="result-item">
          <span>分片数</span>
          <strong>{{ chunksTotal }}</strong>
        </div>
        <p class="result-tip">
          当前前端已按后端真实实现接入 `POST /file/preUploadVideo` 和 `POST /file/uploadVideo`。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { fileApi } from '@/api'

const fileInput = ref(null)

const uploading = ref(false)
const uploadComplete = ref(false)

const uploadingChunkIndex = ref(0)
const chunksTotal = ref(1)
const progress = ref(0)
const errorMsg = ref('')

const uploadId = ref('')
const uploadedFileName = ref('')

// 后端 max-request 15MB、视频 max-file-size 10MB；这里用 1MB 分片
const VIDEO_CHUNK_SIZE = 1 * 1024 * 1024

function triggerUpload() {
  if (uploading.value) return
  fileInput.value?.click()
}

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) handleFile(file)
}

function onDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file) handleFile(file)
}

async function handleFile(file) {
  errorMsg.value = ''
  uploadId.value = ''
  uploadedFileName.value = file.name
  uploadComplete.value = false

  uploading.value = true
  progress.value = 0
  uploadingChunkIndex.value = 0
  chunksTotal.value = Math.max(1, Math.ceil(file.size / VIDEO_CHUNK_SIZE))

  try {
    // 1) 创建 uploadId
    const preRes = await fileApi.preUploadVideo(file.name, chunksTotal.value)
    const data = preRes?.data ?? preRes
    uploadId.value = typeof data === 'string' ? data : data?.uploadId
    if (!uploadId.value) throw new Error('预上传失败：未拿到 uploadId')

    // 2) 逐片上传
    for (let i = 0; i < chunksTotal.value; i++) {
      uploadingChunkIndex.value = i
      const start = i * VIDEO_CHUNK_SIZE
      const end = Math.min(file.size, start + VIDEO_CHUNK_SIZE)
      const blob = file.slice(start, end)

      await fileApi.uploadVideo(
        { uploadId: uploadId.value, chunkIndex: i, chunkFile: blob },
        {
          onUploadProgress: (evt) => {
            const total = evt?.total || 0
            const loaded = evt?.loaded || 0
            const inChunk = total ? loaded / total : 0
            const p = ((i + inChunk) / chunksTotal.value) * 100
            progress.value = Math.min(99, Math.max(0, Math.round(p)))
          }
        }
      )

      progress.value = Math.round(((i + 1) / chunksTotal.value) * 100)
    }

    uploadComplete.value = true
  } catch (e) {
    errorMsg.value = e?.message || String(e)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped lang="scss">
.upload-page {
  padding: 20px 0 40px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.upload-card {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 32px;
}

.upload-hint {
  padding: 12px 16px;
  background: rgba(251, 114, 153, 0.08);
  border-radius: 8px;
  color: var(--bili-pink);
  font-size: 13px;
  margin-bottom: 24px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  border: 2px dashed var(--bili-border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--bili-pink);
    background: rgba(251, 114, 153, 0.04);
  }

  p {
    margin-top: 16px;
    font-size: 15px;
    color: var(--bili-text);
  }

  .sub {
    margin-top: 8px;
    font-size: 13px;
    color: var(--bili-text-tertiary);
  }
}

.upload-progress {
  margin-top: 24px;
  text-align: center;

  p {
    margin-top: 8px;
    font-size: 14px;
    color: var(--bili-text-secondary);
  }
}

.error-msg {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(245, 63, 63, 0.08);
  border: 1px solid rgba(245, 63, 63, 0.22);
  color: #f53f3f;
  font-size: 13px;
}

.progress-bar {
  height: 6px;
  background: #f1f2f3;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--bili-pink);
  border-radius: 3px;
  transition: width 0.3s;
}

.result-card {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--bili-border);

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
  }
}

.result-item {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;

  span {
    width: 72px;
    color: var(--bili-text-secondary);
    flex-shrink: 0;
  }

  strong,
  code {
    word-break: break-all;
  }
}

.result-tip {
  margin-top: 16px;
  font-size: 13px;
  color: var(--bili-text-tertiary);
}
</style>
