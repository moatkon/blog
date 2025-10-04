import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { tagsAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import toast from 'react-hot-toast'

const TagEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    body: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) {
      loadTag()
    }
  }, [id])

  const loadTag = async () => {
    setLoading(true)
    try {
      const response = await tagsAPI.getById(id)
      const tag = response.data
      setFormData({
        name: tag.name || '',
        title: tag.title || '',
        description: tag.description || '',
        body: tag.body || ''
      })
    } catch (error) {
      console.error('Error loading tag:', error)
      toast.error('加载Tag失败')
      navigate('/tags')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('请输入标签名称')
      return
    }

    setSaving(true)
    try {
      const submitData = {
        name: formData.name,
        title: formData.title || formData.name,
        description: formData.description,
        body: formData.body
      }

      if (isEditing) {
        await tagsAPI.update(id, submitData)
        toast.success('Tag更新成功')
      } else {
        await tagsAPI.create(submitData)
        toast.success('Tag创建成功')
      }
      navigate('/tags')
    } catch (error) {
      console.error('Error saving tag:', error)
      const errorMessage = error.response?.data?.error || (isEditing ? '更新Tag失败' : '创建Tag失败')
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tags')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '编辑Tag' : '新建Tag'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* 标签名称 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                标签名称 *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="输入标签名称（用于URL和文件名）"
                required
                disabled={isEditing} // 编辑时不允许修改名称
              />
              {isEditing && (
                <p className="mt-1 text-sm text-gray-500">
                  标签名称在编辑时不能修改
                </p>
              )}
            </div>

            {/* 显示标题 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                显示标题
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="输入显示标题（可选，默认使用标签名称）"
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="输入标签描述（可选）"
              />
            </div>
          </div>
        </div>

        {/* 内容编辑器 */}
        <div className="bg-white shadow rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            详细内容
          </label>
          <MarkdownEditor
            value={formData.body}
            onChange={(value) => setFormData(prev => ({ ...prev, body: value }))}
            placeholder="输入标签的详细说明（可选）..."
          />
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tags')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
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

export default TagEditor
