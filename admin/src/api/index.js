import request from '@/utils/request'

export const accountApi = {
  checkCode: () => request.post('/account/checkCode'),
  login: (data) => request.post('/account/login', data),
  logout: () => request.post('/account/logout')
}

export const categoryApi = {
  loadCategory: () => request.post('/category/loadCategory', { convert2Tree: true }),
  saveCategory: (data) => request.post('/category/saveCategory', data),
  delCategory: (categoryId) => request.delete(`/category/delCategory/${categoryId}`),
  changeSort: (data) => request.post('/category/changeSort', data)
}

export const videoApi = {
  loadVideoList: (params) => request.get('/videoInfo/loadVideoList', { params }),
  auditVideo: (data) => request.post('/videoInfo/auditVideo', data),
  deleteVideo: (videoId) => {
    const data = new FormData()
    data.append('videoId', String(videoId))
    return request.post('/videoInfo/deleteVideo', data)
  },
  recommendVideo: (videoId) => {
    const data = new FormData()
    data.append('videoId', String(videoId))
    return request.post('/videoInfo/recommendVideo', data)
  },
  loadVideoPList: (videoId) => {
    const data = new FormData()
    data.append('videoId', String(videoId))
    return request.post('/videoInfo/loadVideoPList', data)
  }
}

export const indexApi = {
  getActualTimeStatisticsInfo: () => request.post('/index/getActualTimeStatisticsInfo'),
  /** dataType: 0播放 1粉丝/用户 2点赞 3收藏 4投币 5评论 6弹幕 */
  getWeekStatisticsInfo: (dataType) => {
    const data = new FormData()
    if (dataType != null) data.append('dataType', String(dataType))
    return request.post('/index/getWeekStatisticsInfo', data)
  }
}

export const settingApi = {
  getSetting: () => request.post('/setting/getSetting'),
  saveSetting: (data) => request.post('/setting/saveSetting', data)
}

export const interactApi = {
  loadDanmu: ({ pageNo } = {}) => {
    const data = new FormData()
    if (pageNo != null) data.append('pageNo', String(pageNo))
    return request.post('/interact/loadDanmu', data)
  },
  delDanmu: (danmuId) => {
    const data = new FormData()
    data.append('danmuId', String(danmuId))
    return request.post('/interact/delDanmu', data)
  },
  loadComment: ({ pageNo } = {}) => {
    const data = new FormData()
    if (pageNo != null) data.append('pageNo', String(pageNo))
    return request.post('/interact/loadComment', data)
  },
  delComment: (commentId) => {
    const data = new FormData()
    data.append('commentId', String(commentId))
    return request.post('/interact/delComment', data)
  }
}

export const userApi = {
  loadUser: (params) => request.get('/user/loadUser', { params }),
  changeStatus: (params) => request.post('/user/changeStatus', null, { params })
}

export const fileApi = {
  uploadImage: (file, createThumbnail = false) => {
    const data = new FormData()
    data.append('file', file)
    data.append('createThumbnail', String(createThumbnail))
    return request.post('/file/uploadImage', data)
  },
  getResource: (sourceName) => request.get('/file/getResource', { params: { sourceName }, responseType: 'blob' })
}
