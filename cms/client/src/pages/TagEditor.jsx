import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { tagsAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'

const TagEditor = () => {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const id = searchParams.get('id') || params.id || ''
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    body: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    setLoading(true)
    tagsAPI
      .getById(id)
      .then((response) => {
        const tag = response.data
        setFormData({
          name: tag.name || '',
          title: tag.title || '',
          description: tag.description || '',
          body: tag.body || '',
        })
      })
      .catch((error) => {
        console.error('Error loading tag:', error)
        toast.error('加载标签失败')
        navigate('/tags', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEditing, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入标签名称')
      return
    }
    if (formData.name.trim().length > 50) {
      toast.error('标签名称不能超过 50 个字符')
      return
    }

    setSaving(true)
    try {
      const submitData = {
        name: formData.name.trim(),
        title: formData.title.trim() || formData.name.trim(),
        description: formData.description,
        body: formData.body,
      }

      if (isEditing) {
        await tagsAPI.update(id, submitData)
        toast.success('标签已更新')
      } else {
        await tagsAPI.create(submitData)
        toast.success('标签已创建')
      }
      navigate('/tags')
    } catch (error) {
      console.error('Error saving tag:', error)
      toast.error(error.response?.data?.error || (isEditing ? '更新标签失败' : '创建标签失败'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-40" />
        <div className="skeleton h-[420px] w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-ghost btn-sm -ml-2" onClick={() => navigate('/tags')}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-500">
            {isEditing ? '编辑标签' : '新建标签'}
          </span>
        </div>

        <button type="submit" className="btn btn-primary btn-md" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="card flex items-center gap-2 px-4 py-2">
            <input
              value={formData.title}
              maxLength={60}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, title: event.target.value }))
              }
              placeholder="标签显示标题"
              className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none sm:text-3xl"
            />
          </div>

          <MarkdownEditor
            value={formData.body}
            onChange={(value) => setFormData((previous) => ({ ...previous, body: value }))}
            placeholder="写一段标签的详细说明（可选）…"
            className="h-[58vh] min-h-[420px]"
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">标签信息</h2>

            <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="tagName">
              标签名称 *
            </label>
            <input
              id="tagName"
              value={formData.name}
              maxLength={50}
              disabled={isEditing}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, name: event.target.value }))
              }
              placeholder="用于 URL 和文件名"
              className="input mt-1.5 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {isEditing && <p className="mt-1.5 text-[11px] text-slate-400">编辑时不能修改标签名称</p>}

            <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="tagDescription">
              描述
            </label>
            <textarea
              id="tagDescription"
              rows={4}
              value={formData.description}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, description: event.target.value }))
              }
              placeholder="一句话介绍这个标签"
              className="input mt-1.5 resize-none"
            />
          </section>

          <section className="card px-5 py-4 text-xs text-slate-400">
            <span className="font-mono">
              {isEditing ? `src/content/tag/${id}` : '保存后生成标签文件'}
            </span>
          </section>
        </aside>
      </div>
    </form>
  )
}

export default TagEditor
