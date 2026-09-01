<template>
  <div class="upload-page container">
    <h1 class="page-title">{{ isEditMode ? '编辑视频' : '投稿中心' }}</h1>
    <div class="upload-card">
      <p v-if="!isEditMode" class="upload-hint">视频上传功能需要连接后端服务，请确保后端已启动（localhost:7071）</p>

      <div v-if="pageLoading" class="loading-spinner">加载视频信息中...</div>

      <template v-else>
      <div
        class="upload-area"
        :class="{ done: hasUploadedVideos }"
        @click="triggerUpload"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--bili-pink)">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <p v-if="hasUploadedVideos">
          已上传 {{ completedCount }} 个视频，点击或拖拽继续添加
        </p>
        <p v-else>点击或拖拽视频文件到此处上传（可多选）</p>
        <p class="sub">支持 MP4、FLV 等常见格式，最多 {{ maxVideoCount }} 个分P，单个不超过 {{ maxVideoSizeMb }}MB</p>
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          multiple
          hidden
          @change="onFileSelect"
        />
      </div>

      <div v-if="uploadItems.length" class="video-upload-list">
        <div
          v-for="(item, index) in uploadItems"
          :key="item.id"
          class="video-upload-item"
        >
          <span class="p-index">P{{ index + 1 }}</span>
          <div class="item-main">
            <div class="item-name" :title="item.fileName">{{ item.fileName }}</div>
            <div v-if="item.status === 'uploading'" class="item-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: item.progress + '%' }" />
              </div>
              <span class="progress-text">
                {{ item.progress }}%（分片 {{ item.uploadingChunkIndex + 1 }}/{{ item.chunksTotal }}）
              </span>
            </div>
            <div v-else-if="item.status === 'done'" class="item-status done">
              {{ item.existing ? '已有分P' : '上传完成' }}
            </div>
            <div v-else-if="item.status === 'error'" class="item-status error">
              {{ item.error || '上传失败' }}
            </div>
            <div v-else class="item-status">等待上传...</div>
          </div>
          <button
            type="button"
            class="btn-outline item-delete"
            :disabled="item.status === 'uploading' || deleting || publishing"
            @click.stop="deleteUploadItem(item)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <form class="publish-form" @submit.prevent="submitPublish">
        <div v-if="!formEditable && isEditMode" class="error-msg">
          当前视频转码中或待审核，暂不可编辑
        </div>

        <div v-if="hasUploadedVideos" class="uploaded-meta">
          <span>
            {{ isEditMode ? `共 ${completedCount} 个分P` : `已上传 ${completedCount} 个视频，请填写下方信息后投稿` }}
          </span>
          <button
            v-if="!isEditMode"
            type="button"
            class="btn-outline delete-btn"
            :disabled="deleting || publishing || isUploading"
            @click="deleteAllUploaded"
          >
            {{ deleting ? '删除中...' : '清空全部' }}
          </button>
        </div>
        <p v-else class="form-tip">请先上传至少 1 个视频，再填写投稿信息</p>

        <h2>{{ isEditMode ? '修改视频信息' : '填写视频信息' }}</h2>

        <fieldset class="form-fieldset" :disabled="!formEditable || pageLoading">
        <div class="form-row cover-row">
          <div class="form-item">
            <label><span class="req">*</span> 封面</label>
            <input ref="coverInput" type="file" accept="image/*" hidden @change="onCoverSelect" />
            <div class="cover-box" @click="triggerCover">
              <img v-if="coverPreview" :src="coverPreview" alt="" />
              <div v-else-if="coverUploading" class="cover-placeholder">上传中...</div>
              <div v-else class="cover-placeholder">点击选择封面</div>
            </div>
          </div>
          <div class="form-item grow">
            <label><span class="req">*</span> 标题</label>
            <input v-model="form.videoName" type="text" maxlength="80" placeholder="请输入视频标题" />
          </div>
        </div>

        <div class="form-item">
          <label><span class="req">*</span> 类型</label>
          <div class="radio-group">
            <label class="radio">
              <input v-model="form.postType" type="radio" value="0" />
              自制
            </label>
            <label class="radio">
              <input v-model="form.postType" type="radio" value="1" />
              转载
            </label>
          </div>
        </div>

        <div v-if="form.postType === '1'" class="form-item">
          <label><span class="req">*</span> 转载说明</label>
          <input v-model="form.originInfo" type="text" maxlength="200" placeholder="请注明转载来源" />
        </div>

        <div class="form-item">
          <label><span class="req">*</span> 标签</label>
          <div class="tag-box" @click="focusTagInput">
            <span v-for="tag in tagList" :key="tag" class="tag-chip">
              {{ tag }}
              <button type="button" class="tag-remove" @click.stop="removeTag(tag)">×</button>
            </span>
            <input
              ref="tagInput"
              v-model="tagDraft"
              type="text"
              maxlength="15"
              :placeholder="tagList.length ? '' : '按回车键 Enter 创建标签'"
              :disabled="tagList.length >= 10"
              @keydown.enter.prevent="addTag"
            />
          </div>
          <p class="field-hint">
            {{ tagDraft.length }} / 15 · 最多还可以输入 {{ Math.max(0, 10 - tagList.length) }} 个标签
          </p>
        </div>

        <div class="form-item">
          <label><span class="req">*</span> 分区</label>
          <select v-model="selectedCategoryKey" class="select">
            <option value="" disabled>请选择分区</option>
            <option
              v-for="opt in categoryOptions"
              :key="opt.key"
              :value="opt.key"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-item">
          <label>简介</label>
          <textarea
            v-model="form.introduction"
            rows="5"
            maxlength="2000"
            placeholder="填写更全面的相关信息，让更多的人找到你的视频吧"
          />
          <p class="field-hint right">{{ form.introduction.length }} / 2000</p>
        </div>

        <div class="form-item">
          <label>互动设置</label>
          <div class="check-group">
            <label class="check">
              <input v-model="closeDanmu" type="checkbox" />
              关闭弹幕
            </label>
            <label class="check">
              <input v-model="closeComment" type="checkbox" />
              关闭评论
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn-primary"
            :disabled="!canSubmit || publishing || deleting || coverUploading"
          >
            {{ publishing ? (isEditMode ? '保存中...' : '投稿中...') : (isEditMode ? '保存修改' : '立即投稿') }}
          </button>
          <button
            type="button"
            class="btn-outline"
            :disabled="publishing || deleting || isUploading"
            @click="cancelPublish"
          >
            取消
          </button>
        </div>
        </fieldset>
      </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fileApi, ucenterApi, sysApi } from '@/api'
import { useCategoryStore } from '@/stores'
import { getResourceUrl } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const categoryStore = useCategoryStore()

const fileInput = ref(null)
const coverInput = ref(null)
const tagInput = ref(null)

const deleting = ref(false)
const publishing = ref(false)
const coverUploading = ref(false)
const pageLoading = ref(false)
const formEditable = ref(true)

const errorMsg = ref('')

const uploadItems = ref([])
let uploadItemSeq = 0
let queueRunning = false

const videoCover = ref('')
const coverLocalUrl = ref('')
const selectedCategoryKey = ref('')
const tagList = ref([])
const tagDraft = ref('')
const closeDanmu = ref(false)
const closeComment = ref(false)
const categoryOptions = ref([])

const form = reactive({
  videoName: '',
  postType: '0',
  originInfo: '',
  introduction: ''
})

const VIDEO_CHUNK_SIZE = 1 * 1024 * 1024
const maxVideoCount = ref(10)
const maxVideoSizeMb = ref(10)
// 0转码中 1转码失败 2待审核 3审核成功 4审核不通过
const EDITABLE_STATUS = new Set([1, 3, 4])

const editingVideoId = computed(() => route.params.videoId || '')
const isEditMode = computed(() => !!editingVideoId.value)

const hasUploadedVideos = computed(() => uploadItems.value.some((item) => item.status === 'done'))
const completedCount = computed(() => uploadItems.value.filter((item) => item.status === 'done').length)
const isUploading = computed(() => uploadItems.value.some((item) => item.status === 'uploading'))
const canSubmit = computed(
  () => formEditable.value && hasUploadedVideos.value && !isUploading.value && !pageLoading.value
)

/** uploadImage 返回 cover/yyyyMMdd/xx，与 DB 存储格式一致 */
function normalizeCoverPath(raw) {
  let path = String(raw || '').replace(/\\/g, '/').replace(/^\/+/, '')
  if (!path) return ''
  if (path.startsWith('file/')) path = path.slice(5)
  if (path.startsWith('cover/')) return path
  if (/^\d{8}\//.test(path)) return `cover/${path}`
  return path
}

function clearCoverLocalUrl() {
  if (coverLocalUrl.value) {
    URL.revokeObjectURL(coverLocalUrl.value)
    coverLocalUrl.value = ''
  }
}

const coverPreview = computed(() => {
  if (coverLocalUrl.value) return coverLocalUrl.value
  return videoCover.value ? getResourceUrl(videoCover.value) : ''
})

const interactionValue = computed(() => {
  const parts = []
  if (closeDanmu.value) parts.push('1')
  if (closeComment.value) parts.push('0')
  return parts.join(',')
})

function flattenCategories(list, parentName = '') {
  const options = []
  for (const cat of list || []) {
    const id = String(cat.categoryId)
    const pId = cat.pCategoryId != null ? String(cat.pCategoryId) : '0'
    const name = cat.categoryName || id
    const children = cat.children || []
    if (children.length) {
      for (const child of children) {
        const cid = String(child.categoryId)
        options.push({
          key: `${id}:${cid}`,
          label: `${name} / ${child.categoryName}`,
          pCategoryId: id,
          categoryId: cid
        })
      }
    } else {
      options.push({
        key: `${pId === '0' ? id : pId}:${id}`,
        label: parentName ? `${parentName} / ${name}` : name,
        pCategoryId: pId === '0' ? id : pId,
        categoryId: id
      })
    }
  }
  return options
}

function resetFormState() {
  clearCoverLocalUrl()
  videoCover.value = ''
  selectedCategoryKey.value = ''
  tagList.value = []
  tagDraft.value = ''
  closeDanmu.value = false
  closeComment.value = false
  form.videoName = ''
  form.postType = '0'
  form.originInfo = ''
  form.introduction = ''
  if (coverInput.value) coverInput.value.value = ''
}

function resetUploadState() {
  uploadItems.value = []
  errorMsg.value = ''
  formEditable.value = true
  resetFormState()
  if (fileInput.value) fileInput.value.value = ''
}

function createExistingUploadItem(file) {
  return {
    id: `existing-${file.fileId}`,
    fileId: file.fileId,
    uploadId: file.uploadId || '',
    fileName: file.fileName,
    status: 'done',
    progress: 100,
    existing: true,
    uploadingChunkIndex: 0,
    chunksTotal: 1,
    error: ''
  }
}

function fillFormFromVideoInfo(info) {
  form.videoName = info.videoName || ''
  form.postType = String(info.postType ?? '0')
  form.originInfo = info.originInfo || ''
  form.introduction = info.introduction || ''
  videoCover.value = info.videoCover || ''
  tagList.value = (info.tags || '').split(',').map((t) => t.trim()).filter(Boolean)

  const interaction = String(info.interaction || '')
  closeDanmu.value = interaction.split(',').includes('1')
  closeComment.value = interaction.split(',').includes('0')

  if (info.pCategoryId != null && info.categoryId != null) {
    selectedCategoryKey.value = `${info.pCategoryId}:${info.categoryId}`
  }
}

async function loadVideoForEdit(videoId) {
  pageLoading.value = true
  errorMsg.value = ''
  resetUploadState()

  try {
    const res = await ucenterApi.getVideoByVideoId(videoId)
    const payload = res?.data ?? res
    const info = payload.videoInfo || payload
    const files = payload.uploadFileList || payload.fileList || []

    if (!info?.videoId) throw new Error('未找到视频信息')

    const status = Number(info.status)
    formEditable.value = EDITABLE_STATUS.has(status)
    if (!formEditable.value) {
      errorMsg.value = '当前视频转码中或待审核，暂不可编辑'
    }

    fillFormFromVideoInfo(info)
    uploadItems.value = files
      .slice()
      .sort((a, b) => (a.fileIndex ?? 0) - (b.fileIndex ?? 0))
      .map(createExistingUploadItem)
  } catch (e) {
    errorMsg.value = e?.message || String(e)
    formEditable.value = false
  } finally {
    pageLoading.value = false
  }
}

function createUploadItem(file) {
  return {
    id: `upload-${++uploadItemSeq}`,
    file,
    fileName: file.name,
    uploadId: '',
    status: 'pending',
    progress: 0,
    existing: false,
    uploadingChunkIndex: 0,
    chunksTotal: Math.max(1, Math.ceil(file.size / VIDEO_CHUNK_SIZE)),
    error: ''
  }
}

function isVideoFile(file) {
  if (file.type?.startsWith('video/')) return true
  return /\.(mp4|flv|avi|mov|mkv|webm|m4v)$/i.test(file.name)
}

function triggerUpload() {
  if (!formEditable.value || pageLoading.value || isUploading.value || deleting.value || publishing.value) return
  fileInput.value?.click()
}

function onFileSelect(e) {
  const files = e.target.files
  if (files?.length) handleFiles(files)
}

function onDrop(e) {
  if (!formEditable.value || pageLoading.value || isUploading.value || deleting.value || publishing.value) return
  const files = e.dataTransfer.files
  if (files?.length) handleFiles(files)
}

async function handleFiles(fileList) {
  let videoFiles = Array.from(fileList).filter(isVideoFile)
  if (!videoFiles.length) {
    errorMsg.value = '请选择视频文件'
    return
  }

  const maxBytes = maxVideoSizeMb.value * 1024 * 1024
  const oversized = videoFiles.filter((f) => f.size > maxBytes)
  videoFiles = videoFiles.filter((f) => f.size <= maxBytes)
  if (!videoFiles.length) {
    errorMsg.value = `单个视频不能超过 ${maxVideoSizeMb.value}MB`
    return
  }

  const remaining = maxVideoCount.value - uploadItems.value.length
  if (remaining <= 0) {
    errorMsg.value = `最多上传 ${maxVideoCount.value} 个视频`
    return
  }

  const filesToAdd = videoFiles.slice(0, remaining)
  const messages = []
  if (oversized.length) {
    messages.push(`单个视频不能超过 ${maxVideoSizeMb.value}MB，已忽略超限文件`)
  }
  if (filesToAdd.length < videoFiles.length) {
    messages.push(`最多上传 ${maxVideoCount.value} 个视频，已添加前 ${filesToAdd.length} 个`)
  }
  errorMsg.value = messages.join('；')

  const isFirstBatch = !uploadItems.value.length
  const newItems = filesToAdd.map(createUploadItem)
  uploadItems.value.push(...newItems)

  if (isFirstBatch && !form.videoName.trim()) {
    form.videoName = filesToAdd[0].name.replace(/\.[^.]+$/, '')
  }

  if (fileInput.value) fileInput.value.value = ''
  processUploadQueue()
}

async function uploadSingleItem(item) {
  item.status = 'uploading'
  item.progress = 0
  item.error = ''

  try {
    const preRes = await fileApi.preUploadVideo(item.fileName, item.chunksTotal)
    const data = preRes?.data ?? preRes
    item.uploadId = typeof data === 'string' ? data : data?.uploadId
    if (!item.uploadId) throw new Error('预上传失败：未拿到 uploadId')

    for (let i = 0; i < item.chunksTotal; i++) {
      item.uploadingChunkIndex = i
      const start = i * VIDEO_CHUNK_SIZE
      const end = Math.min(item.file.size, start + VIDEO_CHUNK_SIZE)
      const blob = item.file.slice(start, end)

      await fileApi.uploadVideo(
        { uploadId: item.uploadId, chunkIndex: i, chunkFile: blob },
        {
          onUploadProgress: (evt) => {
            const total = evt?.total || 0
            const loaded = evt?.loaded || 0
            const inChunk = total ? loaded / total : 0
            item.progress = Math.min(99, Math.round(((i + inChunk) / item.chunksTotal) * 100))
          }
        }
      )
      item.progress = Math.round(((i + 1) / item.chunksTotal) * 100)
    }

    item.status = 'done'
    item.file = null
  } catch (e) {
    item.status = 'error'
    item.error = e?.message || String(e)
    if (!errorMsg.value) errorMsg.value = `${item.fileName} 上传失败：${item.error}`
  }
}

async function processUploadQueue() {
  if (queueRunning) return
  queueRunning = true
  try {
    while (true) {
      const next = uploadItems.value.find((item) => item.status === 'pending')
      if (!next) break
      await uploadSingleItem(next)
    }
  } finally {
    queueRunning = false
  }
}

async function deleteUploadItem(item) {
  if (item.status === 'uploading' || deleting.value) return
  errorMsg.value = ''

  if (!item.existing && item.uploadId && item.status === 'done') {
    deleting.value = true
    try {
      await fileApi.delUploadVideo(item.uploadId, Math.max(0, item.chunksTotal - 1))
    } catch (e) {
      errorMsg.value = e?.message || String(e)
      return
    } finally {
      deleting.value = false
    }
  }

  uploadItems.value = uploadItems.value.filter((i) => i.id !== item.id)
}

function triggerCover() {
  if (coverUploading.value || publishing.value) return
  coverInput.value?.click()
}

async function onCoverSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  errorMsg.value = ''
  clearCoverLocalUrl()
  coverLocalUrl.value = URL.createObjectURL(file)
  coverUploading.value = true
  try {
    const res = await fileApi.uploadImage(file, true)
    const data = res?.data ?? res
    const raw = typeof data === 'string' ? data : data?.sourceName || data?.filePath || ''
    const sourceName = normalizeCoverPath(raw)
    if (!sourceName) throw new Error('封面上传成功但未获得资源标识')
    videoCover.value = sourceName
  } catch (err) {
    clearCoverLocalUrl()
    videoCover.value = ''
    errorMsg.value = err?.message || String(err)
  } finally {
    coverUploading.value = false
    if (coverInput.value) coverInput.value.value = ''
  }
}

function focusTagInput() {
  tagInput.value?.focus()
}

function addTag() {
  const tag = tagDraft.value.trim()
  if (!tag) return
  if (tag.length > 15) {
    errorMsg.value = '单个标签最多 15 个字'
    return
  }
  if (tagList.value.length >= 10) {
    errorMsg.value = '最多添加 10 个标签'
    return
  }
  if (tagList.value.includes(tag)) {
    tagDraft.value = ''
    return
  }
  tagList.value.push(tag)
  tagDraft.value = ''
  errorMsg.value = ''
}

function removeTag(tag) {
  tagList.value = tagList.value.filter((t) => t !== tag)
}

function validateForm() {
  const doneItems = uploadItems.value.filter((item) => item.status === 'done')
  if (!doneItems.length) return '请先上传至少 1 个视频'
  if (isUploading.value) return '视频上传中，请稍候'
  if (uploadItems.value.some((item) => item.status === 'error')) {
    return '存在上传失败的视频，请删除后重试'
  }
  if (!videoCover.value) return '请上传封面'
  if (!form.videoName.trim()) return '请输入标题'
  if (form.postType === '1' && !form.originInfo.trim()) return '请填写转载说明'
  if (!tagList.value.length) return '请至少添加 1 个标签'
  if (!selectedCategoryKey.value) return '请选择分区'
  return ''
}

async function submitPublish() {
  const msg = validateForm()
  if (msg) {
    errorMsg.value = msg
    return
  }

  const cat = categoryOptions.value.find((c) => c.key === selectedCategoryKey.value)
  if (!cat) {
    errorMsg.value = '请选择有效分区'
    return
  }

  publishing.value = true
  errorMsg.value = ''
  try {
    const data = new FormData()
    data.append('videoCover', videoCover.value)
    data.append('videoName', form.videoName.trim())
    data.append('pCategoryId', cat.pCategoryId)
    data.append('categoryId', cat.categoryId)
    data.append('postType', form.postType)
    data.append('tags', tagList.value.join(','))
    data.append('introduction', form.introduction || '')
    data.append('interaction', interactionValue.value)
    data.append(
      'uploadFileList',
      JSON.stringify(
        uploadItems.value
          .filter((item) => item.status === 'done')
          .map((item) => {
            const row = { uploadId: item.uploadId, fileName: item.fileName }
            if (item.fileId) row.fileId = item.fileId
            return row
          })
      )
    )
    if (form.postType === '1') {
      data.append('originInfo', form.originInfo.trim())
    }
    if (isEditMode.value) {
      data.append('videoId', editingVideoId.value)
    }

    await ucenterApi.postVideo(data)
    alert(isEditMode.value ? '修改成功' : '投稿成功')
    router.push('/account/videos')
  } catch (e) {
    errorMsg.value = e?.message || String(e)
  } finally {
    publishing.value = false
  }
}

async function cleanupNewUploads() {
  const newItems = uploadItems.value.filter(
    (item) => item.status === 'done' && !item.existing && item.uploadId
  )
  for (const item of newItems) {
    await fileApi.delUploadVideo(item.uploadId, Math.max(0, item.chunksTotal - 1))
  }
}

async function deleteAllUploaded() {
  if (!uploadItems.value.length || deleting.value || isUploading.value) return
  errorMsg.value = ''
  deleting.value = true

  try {
    const doneItems = uploadItems.value.filter(
      (item) => !item.existing && item.uploadId && item.status === 'done'
    )
    for (const item of doneItems) {
      await fileApi.delUploadVideo(item.uploadId, Math.max(0, item.chunksTotal - 1))
    }
    resetUploadState()
  } catch (e) {
    errorMsg.value = e?.message || String(e)
  } finally {
    deleting.value = false
  }
}

async function cancelPublish() {
  if (isEditMode.value) {
    deleting.value = true
    try {
      await cleanupNewUploads()
      router.push('/account/videos')
    } catch (e) {
      errorMsg.value = e?.message || String(e)
    } finally {
      deleting.value = false
    }
    return
  }
  await deleteAllUploaded()
}

async function loadSysSetting() {
  try {
    const res = await sysApi.getSetting()
    const s = res.data || {}
    if (s.videoPCount != null) maxVideoCount.value = Number(s.videoPCount) || 10
    if (s.videoSize != null) maxVideoSizeMb.value = Number(s.videoSize) || 10
  } catch {
    // 使用默认上限
  }
}

async function initPage() {
  try {
    const cats = await categoryStore.loadCategories()
    categoryOptions.value = flattenCategories(cats)
  } catch {
    categoryOptions.value = []
  }

  await loadSysSetting()

  if (editingVideoId.value) {
    await loadVideoForEdit(editingVideoId.value)
  } else {
    resetUploadState()
  }
}

onMounted(initPage)

watch(editingVideoId, () => {
  initPage()
})

onUnmounted(() => {
  clearCoverLocalUrl()
})
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

  &.done {
    padding: 28px;
    border-style: solid;
    border-color: rgba(251, 114, 153, 0.35);
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

.video-upload-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-upload-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--bili-border);
  border-radius: 10px;
  background: #fafbfc;
}

.p-index {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(251, 114, 153, 0.12);
  color: var(--bili-pink);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: var(--bili-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-progress {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;

  .progress-bar {
    flex: 1;
  }
}

.progress-text {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--bili-text-tertiary);
}

.item-status {
  margin-top: 6px;
  font-size: 12px;
  color: var(--bili-text-tertiary);

  &.done {
    color: #00b578;
  }

  &.error {
    color: #f53f3f;
  }
}

.item-delete {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 13px;
  color: #f53f3f;
  border-color: rgba(245, 63, 63, 0.35);

  &:hover:not(:disabled) {
    background: rgba(245, 63, 63, 0.06);
    border-color: #f53f3f;
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

.publish-form {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--bili-border);

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 20px 0;
  }
}

.form-tip {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--bili-text-tertiary);
}

.uploaded-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #f6f7f8;
  border-radius: 10px;
  font-size: 13px;
  color: var(--bili-text-secondary);
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.cover-row {
  align-items: flex-start;
}

.grow {
  flex: 1;
  min-width: 240px;
}

.form-item {
  margin-bottom: 18px;

  label {
    display: block;
    font-size: 14px;
    margin-bottom: 8px;
    color: var(--bili-text-secondary);
  }

  .req {
    color: #f53f3f;
    margin-right: 2px;
  }

  input[type='text'],
  textarea,
  .select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--bili-border);
    border-radius: 8px;
    font-size: 14px;
    background: #fff;

    &:focus {
      outline: none;
      border-color: var(--bili-pink);
    }
  }

  textarea {
    resize: vertical;
    min-height: 120px;
  }
}

.cover-box {
  width: 220px;
  aspect-ratio: 16 / 9;
  border: 1px dashed var(--bili-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: #f6f7f8;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bili-text-tertiary);
  font-size: 13px;
}

.radio-group,
.check-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.radio,
.check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--bili-text);
  cursor: pointer;
}

.tag-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 42px;
  padding: 6px 10px;
  border: 1px solid var(--bili-border);
  border-radius: 8px;
  cursor: text;

  input {
    flex: 1;
    min-width: 140px;
    border: 0;
    outline: none;
    padding: 6px 0;
    font-size: 14px;
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(251, 114, 153, 0.1);
  color: var(--bili-pink);
  font-size: 13px;
}

.tag-remove {
  width: 16px;
  height: 16px;
  line-height: 14px;
  border-radius: 50%;
  color: inherit;
  font-size: 14px;
}

.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--bili-text-tertiary);

  &.right {
    text-align: right;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.form-fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;

  &:disabled {
    opacity: 0.72;
    pointer-events: none;
  }
}

.delete-btn {
  color: #f53f3f;
  border-color: rgba(245, 63, 63, 0.35);

  &:hover:not(:disabled) {
    background: rgba(245, 63, 63, 0.06);
    border-color: #f53f3f;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
