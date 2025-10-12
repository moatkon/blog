import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Save, ArrowLeft, Clock } from 'lucide-react'
import { notesAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import AutoSaveIndicator from '../components/AutoSaveIndicator'
import { useAutoSave } from '../hooks/useAutoSave'
import toast from 'react-hot-toast'

const NoteEditor = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // 格式化时间为Notes的ISO格式 (YYYY-MM-DDTHH:mm:ss+08:00)
  const formatDateForNote = (date) => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    // 转换为北京时间并格式化为ISO格式
    const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000))
    return beijingTime.toISOString().replace('Z', '+08:00')
  }

  // 将Notes的ISO格式转换为datetime-local输入格式 (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return ''
    try {
      // Notes格式: "2024-01-01T12:30:45+08:00"
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (error) {
      console.error('Error formatting date for input:', error)
      return ''
    }
  }

  // 从datetime-local输入格式转换为Notes的ISO格式
  const formatInputForNote = (inputValue) => {
    if (!inputValue) return ''
    try {
      // 输入格式: "2024-01-01T12:30"
      const date = new Date(inputValue)
      return formatDateForNote(date)
    } catch (error) {
      console.error('Error formatting input for note:', error)
      return ''
    }
  }

  // 从路径中提取完整的ID
  const isNewNote = location.pathname === '/notes/new'
  const id = isNewNote ? null : (params['*'] || location.pathname.replace('/notes/edit/', ''))
  const isEditing = Boolean(id) && !isNewNote

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    body: '',
    publishDate: isNewNote ? formatDateForNote(new Date()) : '' // 新建时自动填充当前时间
  })
  const [originalNote, setOriginalNote] = useState(null) // 存储原始note数据用于比较
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentId, setCurrentId] = useState(id) // 跟踪当前的ID
  const [isCreating, setIsCreating] = useState(false) // 标记是否正在创建新笔记

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
      const noteData = {
        title: note.title || '',
        description: note.description || '',
        body: note.body || '',
        publishDate: note.publishDate || ''
      }
      setFormData(noteData)
      setOriginalNote(noteData) // 保存原始数据用于比较
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
      if (currentId) {
        // 如果已经有ID，更新现有Note
        await notesAPI.update(currentId, formData)
        toast.success('Note更新成功')
      } else if (!isCreating) {
        // 如果没有ID且未在创建中，创建新Note
        setIsCreating(true);
        try {
          const response = await notesAPI.create(formData)
          toast.success('Note创建成功')
        } finally {
          setIsCreating(false);
        }
      } else {
        // 如果正在创建中，等待创建完成后再处理
        toast.success('Note已保存')
      }
      navigate('/notes')
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error(currentId ? '更新Note失败' : '创建Note失败')
    } finally {
      setSaving(false)
    }
  }

  // 自动保存函数
  const autoSaveFunction = useCallback(async (data) => {
    // 只有在有标题或内容的情况下才自动保存
    if (!data.title?.trim() && !data.body?.trim() && !data.description?.trim()) {
      throw new Error('内容为空时不自动保存');
    }

    // 比较当前数据与原始数据，只有在有实际更改时才保存
    const hasChanges = 
      originalNote && (
        data.title !== originalNote.title ||
        data.description !== originalNote.description ||
        data.body !== originalNote.body
      );

    // 如果是新笔记(没有原始数据)，直接保存
    if (!originalNote) {
      console.log('Note自动保存触发(新笔记):', { currentId, hasTitle: !!data.title?.trim() });
      
      if (currentId) {
        // 已有ID，更新现有Note
        console.log('更新现有Note:', currentId);
        await notesAPI.update(currentId, data);
        // 更新原始数据为当前数据
        setOriginalNote({ ...data });
      } else if (!isCreating) {
        // 没有ID且未在创建中，创建新Note
        console.log('创建新Note');
        setIsCreating(true); // 设置创建状态，防止重复创建
        try {
          const response = await notesAPI.create(data);
          const newNote = response.data;

          // 更新URL和状态，切换到编辑模式
          window.history.replaceState(null, '', `/notes/edit/${newNote.id}`);
          setCurrentId(newNote.id);
          // 更新原始数据
          setOriginalNote({ ...data });
          toast.success('Note已自动创建并保存');
        } finally {
          setIsCreating(false); // 重置创建状态
        }
      }
      return;
    }

    if (!hasChanges) {
      console.log('Note自动保存触发但无实际更改，跳过保存');
      return; // 没有实际更改，不保存
    }

    console.log('Note自动保存触发:', { currentId, hasTitle: !!data.title?.trim(), hasChanges });

    if (currentId) {
      // 已有ID，更新现有Note
      console.log('更新现有Note:', currentId);
      await notesAPI.update(currentId, data);
      // 更新原始数据为当前数据
      setOriginalNote({ ...data });
    } else if (!isCreating) {
      // 没有ID，创建新Note
      console.log('创建新Note');
      setIsCreating(true); // 设置创建状态，防止重复创建
      try {
        const response = await notesAPI.create(data);
        const newNote = response.data;

        // 更新URL和状态，切换到编辑模式
        window.history.replaceState(null, '', `/notes/edit/${newNote.id}`);
        setCurrentId(newNote.id);
        // 更新原始数据
        setOriginalNote({ ...data });
        toast.success('Note已自动创建并保存');
      } finally {
        setIsCreating(false); // 重置创建状态
      }
    }
  }, [currentId, originalNote, isCreating]);

  // 设置当前时间
  const setCurrentTime = () => {
    const now = new Date()
    const formattedTime = formatDateForNote(now)
    setFormData(prev => ({ ...prev, publishDate: formattedTime }))
  }

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
          {/* 自动保存状态指示器 */}
          <AutoSaveIndicator
            status={autoSaveStatus}
            lastSaved={lastSaved}
            onForceSave={forceSave}
            className="ml-4"
          />
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

            {/* 发布日期 */}
            <div>
              <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700">
                发布日期
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="datetime-local"
                  id="publishDate"
                  value={formatDateForInput(formData.publishDate)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    publishDate: formatInputForNote(e.target.value)
                  }))}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={setCurrentTime}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  title="设置为当前时间"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
              {formData.publishDate && (
                <p className="mt-1 text-sm text-gray-500">
                  格式: {formData.publishDate}
                </p>
              )}
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
