export const BLOG_DEV_URL = 'http://localhost:4321'

const ABSOLUTE_URL = /^(https?:|data:|blob:)/i

export function resolveAssetUrl(src) {
  if (!src) return ''
  if (ABSOLUTE_URL.test(src)) return src
  return `/media/${String(src).replace(/^\/+/, '')}`
}

export function toPublicPath(src) {
  return String(src || '')
    .replace(/^\/+/, '')
    .replace(/^public\//, '')
}

export function assetApiPath(src) {
  return String(src || '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
}

export function getPostPreviewUrl(id) {
  const slug = String(id || '').replace(/\.(md|mdx)$/i, '')
  return `${BLOG_DEV_URL}/posts/${slug}/`
}

export function getNotePreviewUrl(id) {
  const slug = String(id || '').replace(/\.(md|mdx)$/i, '')
  return `${BLOG_DEV_URL}/notes/${slug}/`
}
