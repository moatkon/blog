import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { notesAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import toast from 'react-hot-toast'

const NoteEditor = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // 从路径中提取完整的ID
  const isNewNote = location.pathname === '/notes/new'
  const id = isNewNote ? null : (params['*'] || location.pathname.replace('/notes/edit/', ''))
  const isEditing = Boolean(id) && !isNewNote

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    body: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      loadNote()
    }
  }, [isEditing, id])

  const loadNote = async () => {
    setLoading(true)
    try {
      const response = await notesAPI.getById(id)
      const note = response.data
      setFormData({
        title: note.title || '',
        description: note.description || '',
        body: note.body || ''
      })
    } catch (error) {
      console.error('Error loading note:', error)
      toast.error('加载Note失败')
      navigate('/notes')
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
        await notesAPI.update(id, formData)
        toast.success('Note更新成功')
      } else {
        await notesAPI.create(formData)
        toast.success('Note创建成功')
      }
      navigate('/notes')
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error(isEditing ? '更新Note失败' : '创建Note失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/notes')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '编辑Note' : '新建Note'}
          </h1>
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="输入Note标题"
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="输入Note描述（可选）"
              />
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
            placeholder="记录你的想法..."
          />
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
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

export default NoteEditor
