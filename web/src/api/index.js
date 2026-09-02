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
  loadAllCategory: () => request.get('/category/loadAllCategory')
}

export const videoApi = {
  loadRecommendVideo: () => request.get('/video/loadRecommendVideo'),
  loadVideo: (params) => request.get('/video/loadVideo', { params }),
  getVideoInfo: (videoId) => request.get('/video/getVideoInfo', { params: { videoId } }),
  loadVideoPList: (videoId) => request.get('/video/loadVideoPList', { params: { videoId } }),
  reportVideoPlayOnline: (videoId, deviceId) =>
    request.get('/video/reportVideoPlayOnline', { params: { videoId, deviceId } }),
  search: (data) => request.post('/video/search', data),
  getSearchKeywordTop: () => request.post('/video/getSearchKeywordTop'),
  getVideoRecommend: (videoId) => request.post('/video/getVideoRecommend', null, { params: { videoId } }),
  loadHotVideoList: () => request.post('/video/loadHotVideoList')
}

export const commentApi = {
  loadComment: (data) => request.post('/comment/loadComment', data),
  postComment: (data) => request.post('/comment/postComment', data),
  userDelComment: (commentId) => request.post('/comment/userDelComment', { commentId }),
  topComment: (commentId) => request.post('/comment/topComment', { commentId }),
  cancelTopComment: (commentId) => request.post('/comment/cancelTopComment', { commentId })
}

export const danmuApi = {
  loadDanmu: (fileId, videoId) =>
    request.get('/videoDanmu/loadDanmu', { params: { fileId, videoId } }),
  postDanmu: (data) => request.post('/videoDanmu/postDanmu', data)
}

export const userActionApi = {
  doAction: (data) => request.post('/userAction/doAction', data),
  /** 视频点赞 / 收藏 / 投币，commentId 固定传 0 */
  doVideoAction: (videoId, actionType, actionCount = 1, commentId = 0) => {
    const data = new FormData()
    data.append('videoId', videoId)
    data.append('actionType', String(actionType))
    data.append('actionCount', String(actionCount))
    data.append('commentId', String(commentId ?? 0))
    return request.post('/userAction/doAction', data)
  }
}

export const historyApi = {
  loadHistory: () => request.post('/history/loadHistory'),
  delHistory: (videoId) => request.post('/history/delHistory', { videoId }),
  cleanHistory: () => request.post('/history/cleanHistory')
}

export const messageApi = {
  getNoReadCount: () => request.post('/message/getNoReadCount'),
  getNoReadCountGroup: () => request.post('/message/getNoReadCountGroup'),
  loadMessage: () => request.post('/message/loadMessage'),
  readAll: () => request.post('/message/readAll'),
  delMessage: (messageId) => request.post('/message/delMessage', { messageId })
}

export const uhomeApi = {
  getUserInfo: (userId) => request.post('/uhome/getUserInfo', { userId }),
  loadVideoList: (data) => request.post('/uhome/loadVideoList', data),
  loadUserCollection: (data) => request.post('/uhome/loadUserCollection', data),
  updateUserInfo: (data) => request.post('/uhome/updateUserInfo', data),
  focus: (userId) => request.post('/uhome/focus', { userId }),
  cancelFocus: (userId) => request.post('/uhome/cancelFocus', { userId }),
  loadFocusList: (data) => request.post('/uhome/loadFocusList', data),
  loadFansList: (data) => request.post('/uhome/loadFansList', data),
  saveTheme: (data) => request.post('/uhome/saveTheme', data),
  loadVideoSeries: (data) => request.post('/uhome/series/loadVideoSeries', data),
  loadAllVideo: (data) => request.post('/uhome/series/loadAllVideo', data),
  changeVideoSeriesSort: (data) => request.post('/uhome/series/changeVideoSeriesSort', data),
  getVideoSeriesDetail: (data) => request.post('/series/getVideoSeriesDetail', data),
  delVideoSeries: (data) => request.post('/uhome/series/delVideoSeries', data),
  saveVideoSeries: (data) => request.post('/uhome/series/saveVideoSeries', data),
  saveSeriesVideo: (data) => request.post('/uhome/series/saveSeriesVideo', data),
  delSeriesVideo: (data) => request.post('/uhome/series/delSeriesVideo', data),
  loadVideoSeriesWithVideo: (data) => request.post('/uhome/series/loadVideoSeriesWithVideo', data)
}

export const ucenterApi = {
  loadVideoList: (params) => request.get('/ucenter/loadVideoList', { params }),
  getVideoCountInfo: () => request.get('/ucenter/getVideoCountInfo'),
  getVideoByVideoId: (videoId) =>
    request.get('/ucenter/getVideoByVideoId', { params: { videoId } }),
  postVideo: (data) => request.post('/ucenter/postVideo', data),
  saveVideoInteraction: (videoId, interaction) => {
    const data = new FormData()
    data.append('videoId', videoId)
    data.append('interaction', interaction ?? '')
    return request.post('/ucenter/saveVideoInteraction', data)
  },
  deleteVideo: (videoId) => {
    const data = new FormData()
    data.append('videoId', videoId)
    return request.post('/ucenter/deleteVideo', data)
  }
}

export const sysApi = {
  getSetting: () => request.get('/sysSetting/getSetting')
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
    }),
  // 上传封面图，返回 sourceName
  uploadImage: (file, createThumbnail = true) => {
    const data = new FormData()
    data.append('file', file)
    data.append('createThumbnail', String(createThumbnail))
    return request.post('/file/uploadImage', data)
  },
  videoPlaylistUrl: (fileId) => `/api/file/videoResource/${encodeURIComponent(fileId)}/index.m3u8`
}
