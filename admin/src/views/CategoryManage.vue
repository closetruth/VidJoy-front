<template>
  <div class="page-card">
    <div class="page-header">
      <h2>分类管理</h2>
      <button class="btn btn-primary" @click="openForm()">新增分类</button>
    </div>

    <div v-if="message.text" class="toast" :class="message.type">{{ message.text }}</div>
    <div v-if="loading" class="empty-tip">加载中...</div>
    <div v-else-if="errorMsg" class="empty-tip error">{{ errorMsg }}</div>
    <table v-else-if="flatList.length" class="data-table">
      <thead>
        <tr>
          <th>图标</th>
          <th>背景</th>
          <th>分类名称</th>
          <th>分类编码</th>
          <th>父分类</th>
          <th>排序</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in flatList" :key="item.categoryId">
          <td>
            <img
              v-if="item.icon"
              :src="getResourceUrl(item.icon)"
              class="table-icon"
              alt=""
            />
            <span v-else class="no-icon">-</span>
          </td>
          <td>
            <img
              v-if="item.background"
              :src="getResourceUrl(item.background)"
              class="table-bg"
              alt=""
            />
            <span v-else class="no-icon">-</span>
          </td>
          <td>
            <span :style="{ paddingLeft: item._level * 24 + 'px' }">
              <span v-if="item._level > 0" class="tree-line">├─</span>
              {{ item.categoryName }}
            </span>
          </td>
          <td>{{ item.categoryCode || '-' }}</td>
          <td>{{ parentName(item.pCategoryId) }}</td>
          <td>{{ item.sort ?? '-' }}</td>
          <td>
            <button class="btn-link" @click="openForm(item)">编辑</button>
            <button class="btn-link danger" @click="deleteItem(item)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-tip">暂无分类</div>

    <div v-if="formVisible" class="modal-mask" @click.self="formVisible = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ form.categoryId ? '编辑分类' : '新增分类' }}</h3>
          <button @click="formVisible = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>分类名称</label>
            <input v-model="form.categoryName" placeholder="请输入分类名称" />
          </div>
          <div class="form-item">
            <label>分类编码</label>
            <input v-model="form.categoryCode" placeholder="请输入分类编码" />
          </div>
          <div class="form-item">
            <label>父分类</label>
            <select v-model="form.pCategoryId">
              <option value="0">无（一级分类）</option>
              <option v-for="cat in allNodes" :key="cat.categoryId" :value="cat.categoryId">
                {{ '　'.repeat(cat._level) }}{{ cat._level > 0 ? '├─' : '' }}{{ cat.categoryName }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label>分类图标</label>
            <div class="image-upload">
              <div v-if="form.icon" class="image-preview">
                <img :src="getResourceUrl(form.icon)" alt="图标预览" />
                <button type="button" class="btn-link danger" @click="form.icon = ''">清除</button>
              </div>
              <div class="image-upload-actions">
                <input
                  ref="iconInputRef"
                  type="file"
                  accept="image/*"
                  class="file-input"
                  @change="(e) => handleImageUpload(e, 'icon', false)"
                />
                <button
                  type="button"
                  class="btn btn-default"
                  :disabled="uploading.icon"
                  @click="iconInputRef?.click()"
                >
                  {{ uploading.icon ? '上传中...' : form.icon ? '重新上传' : '选择图片' }}
                </button>
              </div>
            </div>
          </div>
          <div class="form-item">
            <label>背景图</label>
            <div class="image-upload">
              <div v-if="form.background" class="image-preview background">
                <img :src="getResourceUrl(form.background)" alt="背景预览" />
                <button type="button" class="btn-link danger" @click="form.background = ''">清除</button>
              </div>
              <div class="image-upload-actions">
                <input
                  ref="backgroundInputRef"
                  type="file"
                  accept="image/*"
                  class="file-input"
                  @change="(e) => handleImageUpload(e, 'background', false)"
                />
                <button
                  type="button"
                  class="btn btn-default"
                  :disabled="uploading.background"
                  @click="backgroundInputRef?.click()"
                >
                  {{ uploading.background ? '上传中...' : form.background ? '重新上传' : '选择图片' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="formVisible = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveForm">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { categoryApi, fileApi } from '@/api'
import { getResourceUrl } from '@/utils/format'

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const formVisible = ref(false)
const iconInputRef = ref(null)
const backgroundInputRef = ref(null)
const uploading = reactive({ icon: false, background: false })
const message = reactive({ text: '', type: 'success' })
let msgTimer = null

function showMsg(text, type = 'success') {
  message.text = text
  message.type = type
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { message.text = '' }, 3000)
}

const MIME_EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp'
}

function buildUploadFile(file) {
  let name = file.name || ''
  if (!name.includes('.')) {
    const ext = MIME_EXT_MAP[file.type] || '.jpg'
    name = `upload${ext}`
    return new File([file], name, { type: file.type })
  }
  return file
}

const form = reactive({
  categoryId: '',
  pCategoryId: '0',
  categoryCode: '',
  categoryName: '',
  icon: '',
  background: ''
})

// 将树形数据扁平化用于表格展示，每项附加缩进层级
function flattenTree(tree, level = 0) {
  const result = []
  for (const item of tree) {
    result.push({ ...item, _level: level })
    if (item.children && item.children.length) {
      result.push(...flattenTree(item.children, level + 1))
    }
  }
  return result
}

const flatList = computed(() => flattenTree(list.value))

// 扁平化所有节点用于父分类下拉
const allNodes = computed(() => {
  const nodes = []
  function walk(tree, level = 0) {
    for (const item of tree) {
      nodes.push({ ...item, _level: level })
      if (item.children && item.children.length) {
        walk(item.children, level + 1)
      }
    }
  }
  walk(list.value)
  return nodes
})

const parentOptions = computed(() => allNodes.value.filter((c) => !c.pCategoryId || c.pCategoryId === 0 || String(c.pCategoryId) === '0'))

function parentName(pCategoryId) {
  if (!pCategoryId || pCategoryId === 0 || String(pCategoryId) === '0') return '一级分类'
  return allNodes.value.find((c) => c.categoryId === pCategoryId)?.categoryName || '-'
}

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await categoryApi.loadCategory()
    list.value = res.data || []
  } catch (e) {
    list.value = []
    errorMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleImageUpload(event, field, createThumbnail) {
  const input = event.target
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showMsg('请选择图片文件', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showMsg('图片大小不能超过 5MB', 'error')
    return
  }
  uploading[field] = true
  try {
    const uploadFile = buildUploadFile(file)
    const res = await fileApi.uploadImage(uploadFile, createThumbnail)
    form[field] = res.data || ''
    if (!form[field]) {
      throw new Error('上传失败，未返回资源路径')
    }
    showMsg('图片上传成功')
  } catch (e) {
    showMsg(e.message || '图片上传失败', 'error')
  } finally {
    uploading[field] = false
  }
}

function openForm(item) {
  if (item) {
    Object.assign(form, {
      categoryId: item.categoryId,
      pCategoryId: item.pCategoryId || '0',
      categoryCode: item.categoryCode || '',
      categoryName: item.categoryName || '',
      icon: item.icon || '',
      background: item.background || ''
    })
  } else {
    Object.assign(form, {
      categoryId: '',
      pCategoryId: '0',
      categoryCode: '',
      categoryName: '',
      icon: '',
      background: ''
    })
  }
  formVisible.value = true
}

async function saveForm() {
  if (!form.categoryName.trim()) {
    showMsg('请输入分类名称', 'error')
    return
  }
  if (!form.categoryCode.trim()) {
    showMsg('请输入分类编码', 'error')
    return
  }
  saving.value = true
  try {
    const data = new FormData()
    // 新增时不传 categoryId，后端用 null 判断走 insert
    if (form.categoryId) {
      data.append('categoryId', String(form.categoryId))
    }
    data.append('pCategoryId', String(form.pCategoryId || 0))
    data.append('categoryCode', form.categoryCode.trim())
    data.append('categoryName', form.categoryName.trim())
    if (form.icon) data.append('icon', form.icon.trim())
    if (form.background) data.append('background', form.background.trim())
    await categoryApi.saveCategory(data)
    formVisible.value = false
    showMsg(form.categoryId ? '编辑成功' : '新增成功')
    await loadList()
  } catch (e) {
    showMsg(e.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

async function deleteItem(item) {
  if (!confirm(`确定删除分类「${item.categoryName}」？`)) return
  try {
    await categoryApi.delCategory(item.categoryId)
    showMsg('删除成功')
    await loadList()
  } catch (e) {
    showMsg(e.message || '删除失败', 'error')
  }
}

onMounted(loadList)
</script>

<style scoped lang="scss">
.empty-tip.error {
  color: var(--admin-danger);
}

.tree-line {
  color: var(--admin-text-tertiary);
  margin-right: 4px;
  font-size: 12px;
}

.table-icon {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--admin-border);
  background: #f7f8fa;
}

.table-bg {
  width: 72px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--admin-border);
  background: #f7f8fa;
}

.no-icon {
  color: var(--admin-text-tertiary);
}

.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 2000;
  animation: toast-in 0.3s ease;

  &.success {
    background: #e8f8ef;
    color: var(--admin-success);
    border: 1px solid #b7ebcf;
  }

  &.error {
    background: #ffece8;
    color: var(--admin-danger);
    border: 1px solid #ffcfc2;
  }
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.file-input {
  display: none;
}

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-preview {
  display: flex;
  align-items: flex-end;
  gap: 12px;

  img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--admin-border);
    background: #f7f8fa;
  }

  &.background img {
    width: 160px;
    height: 90px;
  }
}
</style>
