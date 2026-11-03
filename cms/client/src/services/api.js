import axios from 'axios'
import { assetApiPath } from '../utils/url'

const api = axios.create({
  baseURL: '/api',
  timeout: 20000
})

const encodeId = (id) =>
  String(id)
    .split('/')
    .map(encodeURIComponent)
    .join('/')

const resource = (base) => ({
  getAll: () => api.get(base),
  getById: (id) => api.get(`${base}/${encodeId(id)}`),
  create: (data) => api.post(base, data),
  update: (id, data) => api.put(`${base}/${encodeId(id)}`, data),
  delete: (id) => api.delete(`${base}/${encodeId(id)}`)
})

export const postsAPI = {
  ...resource('/posts'),
  rename: (id, data) => api.put(`/posts/${encodeId(id)}/rename`, data)
}

export const notesAPI = {
  ...resource('/notes'),
  rename: (id, data) => api.put(`/notes/${encodeId(id)}/rename`, data)
}

export const tagsAPI = resource('/tags')

export const assetsAPI = {
  getAll: () => api.get('/assets'),
  getFolder: (path) => api.get(`/assets/folder/${assetApiPath(path)}`),
  upload: (formData) =>
    api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }),
  createFolder: (data) => api.post('/assets/folder', data),
  rename: (oldPath, newName) => api.put('/assets/rename', { oldPath, newName }),
  delete: (path) => api.delete(`/assets/${assetApiPath(path)}`),
  preview: (path) => `/api/assets/preview/${assetApiPath(path)}`
}

export default api
