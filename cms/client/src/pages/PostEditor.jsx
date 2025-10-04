import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Save, ArrowLeft, Eye } from 'lucide-react'
import { postsAPI, tagsAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import toast from 'react-hot-toast'

const PostEditor = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // 从路径中提取完整的ID
  const isNewPost = location.pathname === '/posts/new'
  const id = isNewPost ? null : (params['*'] || location.pathname.replace('/posts/edit/', ''))
  const isEditing = Boolean(id) && !isNewPost

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    body: '',
    draft: true,
    tags: [],
    pinned: false
  })
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAvailableTags()
    if (isEditing && id) {
      loadPost()
    }
  }, [isEditing, id])

  const loadAvailableTags = async () => {
    try {
      const response = await tagsAPI.getAll()
      setAvailableTags(response.data.map(tag => tag.name))
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const loadPost = async () => {
    setLoading(true)
    try {
      const response = await postsAPI.getById(id)
      const post = response.data
      setFormData({
        title: post.title || '',
        description: post.description || '',
        body: post.body || '',
        draft: post.draft !== undefined ? post.draft : true,
        tags: post.tags || [],
        pinned: post.pinned || false
      })
    } catch (error) {
      console.error('Error loading post:', error)
      toast.error('加载Post失败')
      navigate('/posts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('请输入标题')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await postsAPI.update(id, formData)
        toast.success('Post更新成功')
      } else {
        await postsAPI.create(formData)
        toast.success('Post创建成功')
      }
      navigate('/posts')
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error(isEditing ? '更新Post失败' : '创建Post失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTagChange = (tagInput) => {
    const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({ ...prev, tags }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/posts')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? '编辑Post' : '新建Post'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, draft: !prev.draft }))}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.draft
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {formData.draft ? '草稿' : '已发布'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* 标题 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                标题 *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入Post标题"
                required
              />
            </div>

            {/* 描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                描述
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入Post描述"
              />
            </div>

            {/* 标签 */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                标签
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagChange(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入标签，用逗号分隔"
              />
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">可用标签：</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!formData.tags.includes(tag)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
                          }
                        }}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 置顶 */}
            <div className="flex items-center">
              <input
                id="pinned"
                type="checkbox"
                checked={formData.pinned}
                onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="pinned" className="ml-2 block text-sm text-gray-900">
                置顶文章
              </label>
            </div>
          </div>
        </div>

        {/* 内容编辑器 */}
        <div className="bg-white shadow rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            内容
          </label>
          <MarkdownEditor
            value={formData.body}
            onChange={(value) => setFormData(prev => ({ ...prev, body: value }))}
            placeholder="开始写作..."
          />
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PostEditor
