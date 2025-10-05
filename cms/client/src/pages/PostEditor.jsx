import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Save, ArrowLeft, Eye, Image as ImageIcon, X } from 'lucide-react'
import { postsAPI, tagsAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import ImagePickerModal from '../components/ImagePickerModal'
import AutoSaveIndicator from '../components/AutoSaveIndicator'
import { useAutoSave } from '../hooks/useAutoSave'
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
    pinned: false,
    coverImage: null // { src: '', alt: '' }
  })
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [currentId, setCurrentId] = useState(id) // 跟踪当前的ID

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
        pinned: post.pinned || false,
        coverImage: post.coverImage || null
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

  const handleImageSelect = (imagePath) => {
    setFormData(prev => ({
      ...prev,
      coverImage: {
        src: imagePath,
        alt: formData.title || '封面图'
      }
    }))
    setShowImagePicker(false)
    toast.success('封面图已选择')
  }

  const handleRemoveCoverImage = () => {
    setFormData(prev => ({ ...prev, coverImage: null }))
    toast.success('封面图已移除')
  }

  // 自动保存函数
  const autoSaveFunction = useCallback(async (data) => {
    // 只有在有标题或内容的情况下才自动保存
    if (!data.title?.trim() && !data.body?.trim() && !data.description?.trim()) {
      throw new Error('内容为空时不自动保存');
    }

    console.log('自动保存触发:', { currentId, hasTitle: !!data.title?.trim() });

    if (currentId) {
      // 已有ID，更新现有Post
      console.log('更新现有Post:', currentId);
      await postsAPI.update(currentId, data);
    } else {
      // 没有ID，创建新Post
      console.log('创建新Post');
      const response = await postsAPI.create(data);
      const newPost = response.data;

      // 更新URL和状态，切换到编辑模式
      window.history.replaceState(null, '', `/posts/edit/${newPost.id}`);
      setCurrentId(newPost.id);
      toast.success('Post已自动创建并保存');
    }
  }, [currentId]);

  // 使用自动保存Hook
  const { status: autoSaveStatus, lastSaved, forceSave } = useAutoSave({
    saveFunction: autoSaveFunction,
    data: formData,
    delay: 3000, // 3秒延迟
    enabled: !saving, // 只要不在手动保存就启用自动保存
    onSaveSuccess: () => {
      // 自动保存成功时的回调
    },
    onSaveError: (error) => {
      console.error('Auto save failed:', error);
    }
  });

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
            {/* 自动保存状态指示器 */}
            <AutoSaveIndicator
              status={autoSaveStatus}
              lastSaved={lastSaved}
              onForceSave={forceSave}
              className="ml-4"
            />
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

            {/* 封面图 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                封面图
              </label>
              {formData.coverImage ? (
                <div className="relative inline-block">
                  <img
                    src={`/api/assets/preview/${formData.coverImage.src}`}
                    alt={formData.coverImage.alt}
                    className="w-32 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      更换封面图
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="flex items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">选择封面图</span>
                  </div>
                </button>
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

      {/* 图片选择器模态框 */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleImageSelect}
      />
    </div>
  )
}

export default PostEditor
