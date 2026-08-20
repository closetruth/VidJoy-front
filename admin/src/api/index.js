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
  deleteVideo: (videoId) => request.post('/videoInfo/deleteVideo', { videoId }),
  recommendVideo: (videoId) => request.post('/videoInfo/recommendVideo', { videoId }),
  loadVideoPList: (videoId) => request.post('/videoInfo/loadVideoPList', { videoId })
}

export const indexApi = {
  getActualTimeStatisticsInfo: () => request.post('/index/getActualTimeStatisticsInfo'),
  getWeekStatisticsInfo: () => request.post('/index/getWeekStatisticsInfo')
}

export const settingApi = {
  getSetting: () => request.post('/setting/getSetting'),
  saveSetting: (data) => request.post('/setting/saveSetting', data)
}

export const interactApi = {
  loadDanmu: (data) => request.post('/interact/loadDanmu', data),
  delDanmu: (danmuId) => request.post('/interact/delDanmu', { danmuId }),
  loadComment: (data) => request.post('/interact/loadComment', data),
  delComment: (commentId) => request.post('/interact/delComment', { commentId })
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
