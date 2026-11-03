import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Copy, Eye, ExternalLink, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { notesAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import AutoSaveIndicator from '../components/AutoSaveIndicator'
import ConfirmDialog from '../components/ConfirmDialog'
import PreviewModal from '../components/PreviewModal'
import RenameModal from '../components/RenameModal'
import { useAutoSave } from '../hooks/useAutoSave'
import {
  formatDateTime,
  formatForDateInput,
  fromInputToNoteDate,
  toNoteDate,
} from '../utils/date'
import { getNotePreviewUrl } from '../utils/url'

const LOCAL_DRAFT_KEY = 'cms:note-draft'

const emptyNote = () => ({
  title: '',
  description: '',
  body: '',
  publishDate: toNoteDate(),
})

const buildPayload = (data) => ({
  title: data.title.trim(),
  description: data.description ?? '',
  body: data.body ?? '',
  publishDate: data.publishDate || toNoteDate(),
})

const NoteEditor = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isNewNote = location.pathname === '/notes/new'
  const legacyId = params['*'] || location.pathname.replace('/notes/edit/', '')
  const routeId = searchParams.get('id') || legacyId
  const id = isNewNote ? null : decodeURIComponent(routeId)

  const [formData, setFormData] = useState(emptyNote)
  const [baseline, setBaseline] = useState(null)
  const [meta, setMeta] = useState({ filePath: '', updatedDate: null })
  const [currentId, setCurrentId] = useState(id)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  const formRef = useRef(formData)
  const currentIdRef = useRef(currentId)
  formRef.current = formData
  currentIdRef.current = currentId

  const dirty = baseline !== null ? JSON.stringify(formData) !== baseline : Boolean(formData.title || formData.body)

  const autosave = useCallback(async (data) => {
    if (!data.title?.trim()) return

    const payload = buildPayload(data)

    if (!currentIdRef.current) {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload))
      return
    }

    await notesAPI.update(currentIdRef.current, payload)
  }, [])

  const { status, lastSaved, markSaved, reset } = useAutoSave({
    data: formData,
    onSave: autosave,
    delay: 1800,
    enabled: !loading && !saving,
    shouldSave: (data) => Boolean(data.title?.trim() || data.body?.trim()),
  })

  const loadNote = useCallback(
    async (noteId) => {
      setLoading(true)
      try {
        const response = await notesAPI.getById(noteId)
        const note = response.data
        const nextData = {
          title: note.title || '',
          description: note.description || '',
          body: note.body || '',
          publishDate: note.publishDate || toNoteDate(),
        }
        setFormData(nextData)
        setBaseline(JSON.stringify(nextData))
        reset(nextData)
        setMeta({ filePath: note.filePath || '', updatedDate: note.updatedDate || null })
        setCurrentId(noteId)
      } catch (error) {
        console.error('Error loading note:', error)
        toast.error('加载笔记失败')
        navigate('/notes', { replace: true })
      } finally {
        setLoading(false)
      }
    },
    [navigate, reset]
  )

  useEffect(() => {
    if (!id) return
    loadNote(id)
  }, [id, loadNote])

  useEffect(() => {
    if (id) return

    try {
      const raw = localStorage.getItem(LOCAL_DRAFT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed?.title?.trim() && !parsed?.body?.trim()) return

      setFormData((previous) => ({ ...previous, ...parsed }))
      setBaseline(null)
      toast('已恢复上次未保存的本地草稿', { icon: '↩️' })
    } catch {
      localStorage.removeItem(LOCAL_DRAFT_KEY)
    }
  }, [id])

  const handleSave = useCallback(
    async ({ silent = false } = {}) => {
      if (!formRef.current.title?.trim()) {
        toast.error('请先填写标题')
        return null
      }
      if (formRef.current.title.trim().length > 60) {
        toast.error('标题不能超过 60 个字符')
        return null
      }

      setSaving(true)
      try {
        const payload = buildPayload(formRef.current)
        let savedId = currentIdRef.current

        if (savedId) {
          await notesAPI.update(savedId, payload)
        } else {
          const response = await notesAPI.create(payload)
          savedId = response.data.id
          setCurrentId(savedId)
          currentIdRef.current = savedId
          localStorage.removeItem(LOCAL_DRAFT_KEY)
          navigate(`/notes/edit?id=${encodeURIComponent(savedId)}`, { replace: true })
        }

        setFormData(payload)
        setBaseline(JSON.stringify(payload))
        markSaved(payload)
        setMeta((previous) => ({ ...previous, updatedDate: new Date().toISOString() }))

        if (!silent) toast.success('已保存')
        return savedId
      } catch (error) {
        console.error('Error saving note:', error)
        toast.error('保存失败，请检查服务是否正常')
        return null
      } finally {
        setSaving(false)
      }
    },
    [markSaved, navigate]
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const openInBlog = async () => {
    const newWindow = window.open('', '_blank')
    const savedId = await handleSave({ silent: true })
    if (savedId) {
      const url = getNotePreviewUrl(savedId)
      if (newWindow) newWindow.location.href = url
      else window.open(url, '_blank', 'noopener')
    } else {
      newWindow?.close()
    }
  }

  const handleRename = async (newPath) => {
    if (!currentId) return
    await notesAPI.rename(currentId, { newPath })
    toast.success('文件路径已更新')
    navigate(`/notes/edit?id=${encodeURIComponent(newPath)}`, { replace: true })
  }

  const copyPath = async () => {
    const path = meta.filePath || (currentId ? `src/content/note/${currentId}` : '')
    if (!path) return
    try {
      await navigator.clipboard.writeText(path)
      toast.success('文件路径已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-40" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-[520px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm -ml-2"
            onClick={() => (dirty ? setLeaveOpen(true) : navigate('/notes'))}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-500">
            {currentId ? '编辑笔记' : '新建笔记'}
          </span>
          <AutoSaveIndicator
            status={status}
            lastSaved={lastSaved}
            dirty={dirty}
            localDraft={!currentId}
            className="hidden sm:inline-flex"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AutoSaveIndicator
            status={status}
            lastSaved={lastSaved}
            dirty={dirty}
            localDraft={!currentId}
            className="sm:hidden"
          />
          <button type="button" className="btn btn-secondary btn-md" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
            预览
          </button>
          <button type="button" className="btn btn-secondary btn-md" onClick={openInBlog}>
            <ExternalLink className="h-4 w-4" />
            在博客中打开
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md"
            disabled={saving}
            onClick={() => handleSave()}
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
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
              placeholder="笔记标题"
              className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none sm:text-3xl"
            />
            {formData.title.length > 50 && (
              <span className="shrink-0 text-xs text-slate-400">{formData.title.length}/60</span>
            )}
          </div>

          <MarkdownEditor
            value={formData.body}
            onChange={(value) => setFormData((previous) => ({ ...previous, body: value }))}
            onSave={() => handleSave()}
            placeholder="记录想法… 支持 Markdown、拖拽或粘贴图片"
            className="h-[68vh] min-h-[520px] xl:h-[calc(100vh-15.5rem)]"
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">发布设置</h2>
              {meta.updatedDate && (
                <span className="text-[11px] text-slate-400">更新于 {formatDateTime(meta.updatedDate)}</span>
              )}
            </div>

            <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="publishDate">
              发布日期
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="publishDate"
                type="datetime-local"
                value={formatForDateInput(formData.publishDate)}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    publishDate: fromInputToNoteDate(event.target.value),
                  }))
                }
                className="input"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm shrink-0"
                onClick={() => setFormData((previous) => ({ ...previous, publishDate: toNoteDate() }))}
              >
                现在
              </button>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">摘要</h2>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, description: event.target.value }))
              }
              placeholder="可选，用于列表页展示"
              className="input mt-3 resize-none"
            />
          </section>

          <section className="card px-5 py-4 text-xs text-slate-400">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono">{currentId || '保存后生成文件路径'}</span>
              {currentId && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm px-2 py-1 text-[11px]"
                    onClick={() => setRenameOpen(true)}
                  >
                    重命名
                  </button>
                  <button type="button" className="btn-icon p-1" onClick={copyPath} title="复制路径">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        type="note"
        data={{ ...formData, id: currentId }}
      />

      <RenameModal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        onRename={handleRename}
        currentPath={currentId}
        title={formData.title}
        type="note"
      />

      <ConfirmDialog
        open={leaveOpen}
        title="离开编辑器？"
        message="当前有未保存的修改，离开后这些修改会丢失。"
        confirmLabel="离开"
        onConfirm={() => {
          setLeaveOpen(false)
          navigate('/notes')
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  )
}

export default NoteEditor
