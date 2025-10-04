import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Posts API
export const postsAPI = {
  getAll: () => api.get('/posts'),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`)
}

// Notes API
export const notesAPI = {
  getAll: () => api.get('/notes'),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`)
}

// Tags API
export const tagsAPI = {
  getAll: () => api.get('/tags'),
  getById: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`)
}

// Assets API
export const assetsAPI = {
  getAll: () => api.get('/assets'),
  getFolder: (path) => api.get(`/assets/folder/${path}`),
  upload: (formData) => api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createFolder: (data) => api.post('/assets/folder', data),
  delete: (path) => api.delete(`/assets/${path}`),
  preview: (path) => `/api/assets/preview/${path}`
}

export default api
