import request from '@/utils/request'

export const accountApi = {
  checkCode: () => request.post('/account/checkCode'),
  register: (data) => request.post('/account/register', data),
  login: (data) => request.post('/account/login', data),
  autoLogin: () => request.post('/account/autoLogin'),
  logout: () => request.post('/account/logout'),
  getUserCountInfo: () => request.post('/account/getUserCountInfo')
}

export const categoryApi = {
  loadAllCategory: () => request.post('/category/loadAllCategory')
}

export const videoApi = {
  loadRecommendVideo: () => request.post('/video/loadRecommendVideo'),
  loadVideo: (data) => request.post('/video/loadVideo', data),
  getVideoInfo: (videoId) => request.post('/video/getVideoInfo', null, { params: { videoId } }),
  // 获取视频分P：返回 VideoInfoFile 列表（fileId / fileName / fileIndex / duration）
  loadVideoPList: (videoId) => request.post('/video/loadVideoPList', null, { params: { videoId } }),
  search: (data) => request.post('/video/search', data),
  getSearchKeywordTop: () => request.post('/video/getSearchKeywordTop'),
  getVideoRecommend: (videoId) => request.post('/video/getVideoRecommend', null, { params: { videoId } }),
  loadHotVideoList: () => request.post('/video/loadHotVideoList'),
  reportVideoPlayOnline: (data) => request.post('/video/reportVideoPlayOnline', data)
}

export const commentApi = {
  loadComment: (data) => request.post('/comment/loadComment', data),
  postComment: (data) => request.post('/comment/postComment', data),
  userDelComment: (commentId) => request.post('/comment/userDelComment', { commentId })
}

export const danmuApi = {
  loadDanmu: (data) => request.post('/danmu/loadDanmu', data),
  postDanmu: (data) => request.post('/danmu/postDanmu', data)
}

export const userActionApi = {
  doAction: (data) => request.post('/userAction/doAction', data)
}

export const historyApi = {
  loadHistory: () => request.post('/history/loadHistory'),
  delHistory: (videoId) => request.post('/history/delHistory', { videoId }),
  cleanHistory: () => request.post('/history/cleanHistory')
}

export const messageApi = {
  getNoReadCount: () => request.post('/message/getNoReadCount'),
  loadMessage: () => request.post('/message/loadMessage'),
  readAll: () => request.post('/message/readAll')
}

export const uhomeApi = {
  getUserInfo: (userId) => request.post('/uhome/getUserInfo', { userId }),
  loadVideoList: (data) => request.post('/uhome/loadVideoList', data),
  loadUserCollection: (data) => request.post('/uhome/loadUserCollection', data),
  updateUserInfo: (data) => request.post('/uhome/updateUserInfo', data),
  focus: (userId) => request.post('/uhome/focus', { userId }),
  cancelFocus: (userId) => request.post('/uhome/cancelFocus', { userId })
}

export const ucenterApi = {
  loadVideoList: (data) => request.post('/ucenter/loadVideoList', data),
  getVideoCountInfo: () => request.post('/ucenter/getVideoCountInfo')
}

export const sysApi = {
  getSetting: () => request.post('/sysSetting/getSetting')
}

export const fileApi = {
  // 预上传：创建 uploadId
  preUploadVideo: (fileName, chunks) => {
    const data = new FormData()
    data.append('fileName', fileName)
    data.append('chunks', String(chunks))
    return request.post('/file/preUploadVideo', data)
  },
  // 上传视频分片：按 chunkIndex 顺序上传
  uploadVideo: ({ uploadId, chunkIndex, chunkFile }, config) => {
    const data = new FormData()
    data.append('uploadId', uploadId)
    data.append('chunkIndex', String(chunkIndex))
    data.append('chunkFile', chunkFile)
    return request.post('/file/uploadVideo', data, config)
  },
  // 删除本次已上传视频（清 Redis + 临时目录）
  delUploadVideo: (uploadId, chunkIndex) =>
    request.delete('/file/delUploadVideo', {
      params: { uploadId, chunkIndex }
    })
}
