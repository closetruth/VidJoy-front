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
  /** 在线人数心跳：后端 @RequestMapping，GET 传 videoId + deviceId */
  reportVideoPlayOnline: (videoId, deviceId) =>
    request.get('/video/reportVideoPlayOnline', { params: { videoId, deviceId } }),
  search: (data) => request.post('/video/search', data),
  getSearchKeywordTop: () => request.post('/video/getSearchKeywordTop'),
  getVideoRecommend: (videoId) => request.post('/video/getVideoRecommend', null, { params: { videoId } }),
  loadHotVideoList: () => request.post('/video/loadHotVideoList')
}

export const commentApi = {
  /** 后端返回 VideoCommentResultVO { commentData, userActionList } */
  loadComment: (data) => request.post('/comment/loadComment', data),
  /** FormData: videoId, content, replyCommentId?(仅回复时), imgPath? */
  postComment: (data) => request.post('/comment/postComment', data),
  /** FormData: commentId — 仅视频 UP 主；后端路径为 /comment/TopComment */
  topComment: (commentId) => {
    const data = new FormData()
    data.append('commentId', String(commentId))
    return request.post('/comment/TopComment', data)
  },
  /** FormData: commentId — 仅视频 UP 主 */
  cancelTopComment: (commentId) => {
    const data = new FormData()
    data.append('commentId', String(commentId))
    return request.post('/comment/cancelTopComment', data)
  },
  /** FormData: commentId — 评论作者或视频 UP 主 */
  userDelComment: (commentId) => {
    const data = new FormData()
    data.append('commentId', String(commentId))
    return request.post('/comment/userDelComment', data)
  }
}

export const danmuApi = {
  loadDanmu: (fileId, videoId) =>
    request.get('/videoDanmu/loadDanmu', { params: { fileId, videoId } }),
  postDanmu: (data) => request.post('/videoDanmu/postDanmu', data)
}

export const userActionApi = {
  doAction: (data) => request.post('/userAction/doAction', data),
  /**
   * 用户行为：视频赞/藏/币 commentId 传 0；评论赞传真实 commentId，actionType=0
   */
  doVideoAction: (videoId, actionType, actionCount = 1, commentId = 0) => {
    const data = new FormData()
    data.append('videoId', videoId)
    data.append('actionType', String(actionType))
    data.append('actionCount', String(actionCount ?? 1))
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
  getUserInfo: (userId) => request.get('/uhome/getUserInfo', { params: { userId } }),
  loadVideoList: (params) => request.get('/uhome/loadVideoList', { params }),
  loadVideoCollection: (params) => request.get('/uhome/loadVideoCollection', { params }),
  /** @deprecated 使用 loadVideoCollection */
  loadUserCollection: (params) => {
    if (params instanceof FormData) {
      const userId = params.get('userId')
      const pageNo = params.get('pageNo')
      return request.get('/uhome/loadVideoCollection', {
        params: {
          ...(userId ? { userId } : {}),
          ...(pageNo ? { pageNo } : {})
        }
      })
    }
    return request.get('/uhome/loadVideoCollection', { params })
  },
  updateUserInfo: (data) => request.post('/uhome/updateUserInfo', data),
  focus: (focusUserId) => {
    const data = new FormData()
    data.append('focusUserId', String(focusUserId))
    return request.post('/uhome/focus', data)
  },
  cancelFocus: (focusUserId) => {
    const data = new FormData()
    data.append('focusUserId', String(focusUserId))
    return request.post('/uhome/cancelFocus', data)
  },
  loadFocusList: (pageNo = 1) =>
    request.get('/uhome/loadFocusList', { params: { pageNo } }),
  loadFansList: (pageNo = 1) =>
    request.get('/uhome/loadFansList', { params: { pageNo } }),
  saveTheme: (theme) => {
    const data = new FormData()
    data.append('theme', String(theme))
    return request.post('/uhome/saveTheme', data)
  },
  loadVideoSeries: (userId) =>
    request.get('/uhome/series/loadVideoSeries', { params: { userId } }),
  loadAllVideo: (seriesId) => {
    const data = new FormData()
    if (seriesId != null && seriesId !== '') data.append('seriesId', String(seriesId))
    return request.post('/uhome/series/loadAllVideo', data)
  },
  saveVideoSeries: ({ seriesId, seriesName, seriesDescription, videoIds }) => {
    const data = new FormData()
    if (seriesId != null && seriesId !== '') data.append('seriesId', String(seriesId))
    data.append('seriesName', seriesName)
    if (seriesDescription != null) data.append('seriesDescription', seriesDescription)
    if (videoIds) data.append('videoIds', videoIds)
    return request.post('/uhome/series/saveVideoSeries', data)
  }
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
