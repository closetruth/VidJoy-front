/**
 * 解析 VidJoy 验证码接口返回
 * @returns {{ img: string, key: string }}
 */
export function parseCaptchaResponse(res) {
  const data = res?.data
  if (!data) {
    throw new Error('验证码数据为空')
  }

  let img = ''
  let key = ''

  if (typeof data === 'string') {
    img = data
  } else if (typeof data === 'object') {
    img = data.checkCode || data.checkcode || data.code || ''
    key = data.checkCodeKey || data.checkcodekey || data.key || ''
  }

  if (!img) {
    throw new Error('验证码图片为空')
  }

  if (!img.startsWith('data:') && !img.startsWith('http')) {
    img = `data:image/png;base64,${img}`
  }

  return { img, key }
}
