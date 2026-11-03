import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Copy, Eye, ExternalLink, Image as ImageIcon, Save, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { postsAPI, tagsAPI } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor'
import ImagePickerModal from '../components/ImagePickerModal'
import AutoSaveIndicator from '../components/AutoSaveIndicator'
import ConfirmDialog from '../components/ConfirmDialog'
import TagSelector from '../components/TagSelector'
import PreviewModal from '../components/PreviewModal'
import RenameModal from '../components/RenameModal'
import { useAutoSave } from '../hooks/useAutoSave'
import { assetsAPI } from '../services/api'
import {
  formatDate,
  formatDateTime,
  formatForDateInput,
  fromInputToPostDate,
  toPostDate,
} from '../utils/date'
import { getPostPreviewUrl, toPublicPath } from '../utils/url'

const LOCAL_DRAFT_KEY = 'cms:post-draft'

const emptyPost = () => ({
  title: '',
  description: '',
  body: '',
  draft: true,
  tags: [],
  pinned: false,
  coverImage: null,
  publishDate: toPostDate(),
})

const buildPayload = (data) => ({
  title: data.title.trim(),
  description: data.description ?? '',
  body: data.body ?? '',
  draft: Boolean(data.draft),
  tags: Array.isArray(data.tags) ? data.tags : [],
  pinned: Boolean(data.pinned),
  coverImage: data.coverImage?.src ? data.coverImage : null,
  publishDate: data.publishDate || toPostDate(),
})

const PostEditor = () => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isNewPost = location.pathname === '/posts/new'
  const legacyId = params['*'] || location.pathname.replace('/posts/edit/', '')
  const routeId = searchParams.get('id') || legacyId
  const id = isNewPost ? null : decodeURIComponent(routeId)

  const [formData, setFormData] = useState(emptyPost)
  const [baseline, setBaseline] = useState(null)
  const [meta, setMeta] = useState({ filePath: '', updatedDate: null })
  const [currentId, setCurrentId] = useState(id)
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
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

    await postsAPI.update(currentIdRef.current, payload)
  }, [])

  const { status, lastSaved, markSaved, reset } = useAutoSave({
    data: formData,
    onSave: autosave,
    delay: 1800,
    enabled: !loading && !saving,
    shouldSave: (data) => Boolean(data.title?.trim() || data.body?.trim()),
  })

  const loadPost = useCallback(
    async (postId) => {
      setLoading(true)
      try {
        const response = await postsAPI.getById(postId)
        const post = response.data
        const nextData = {
          title: post.title || '',
          description: post.description || '',
          body: post.body || '',
          draft: post.draft !== undefined ? post.draft : true,
          tags: post.tags || [],
          pinned: Boolean(post.pinned),
          coverImage: post.coverImage || null,
          publishDate: post.publishDate || toPostDate(),
        }
        setFormData(nextData)
        setBaseline(JSON.stringify(nextData))
        reset(nextData)
        setMeta({ filePath: post.filePath || '', updatedDate: post.updatedDate || null })
        setCurrentId(postId)
      } catch (error) {
        console.error('Error loading post:', error)
        toast.error('加载文章失败')
        navigate('/posts', { replace: true })
      } finally {
        setLoading(false)
      }
    },
    [navigate, reset]
  )

  useEffect(() => {
    tagsAPI
      .getAll()
      .then((response) => setAvailableTags(response.data.map((tag) => tag.name)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    loadPost(id)
  }, [id, loadPost])

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
    async ({ publish, silent = false } = {}) => {
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
        const payload = buildPayload({
          ...formRef.current,
          draft: publish === undefined ? formRef.current.draft : !publish,
        })

        let savedId = currentIdRef.current

        if (savedId) {
          await postsAPI.update(savedId, payload)
        } else {
          const response = await postsAPI.create(payload)
          savedId = response.data.id
          setCurrentId(savedId)
          currentIdRef.current = savedId
          localStorage.removeItem(LOCAL_DRAFT_KEY)
          navigate(`/posts/edit?id=${encodeURIComponent(savedId)}`, { replace: true })
        }

        setFormData(payload)
        setBaseline(JSON.stringify(payload))
        markSaved(payload)
        setMeta((previous) => ({
          ...previous,
          updatedDate: publish === undefined ? previous.updatedDate : new Date().toISOString(),
        }))

        if (!silent) {
          if (publish === true) toast.success('文章已发布')
          else if (publish === false) toast.success('已转为草稿')
          else toast.success('已保存')
        }

        return savedId
      } catch (error) {
        console.error('Error saving post:', error)
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
      const url = getPostPreviewUrl(savedId)
      if (newWindow) newWindow.location.href = url
      else window.open(url, '_blank', 'noopener')
    } else {
      newWindow?.close()
    }
  }

  const handleBack = () => {
    if (dirty) setLeaveOpen(true)
    else navigate('/posts')
  }

  const setPublishDateNow = () => {
    setFormData((previous) => ({ ...previous, publishDate: toPostDate() }))
  }

  const handleCoverSelect = (path) => {
    setFormData((previous) => ({
      ...previous,
      coverImage: {
        src: toPublicPath(path),
        alt: previous.title || '封面图',
      },
    }))
    setShowImagePicker(false)
  }

  const handleRename = async (newPath) => {
    if (!currentId) return
    await postsAPI.rename(currentId, { newPath })
    toast.success('文件路径已更新')
    navigate(`/posts/edit?id=${encodeURIComponent(newPath)}`, { replace: true })
  }

  const copyPath = async () => {
    const path = meta.filePath || (currentId ? `src/content/post/${currentId}` : '')
    if (!path) return
    try {
      await navigator.clipboard.writeText(path)
      toast.success('文件路径已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const tagSuggestions = useMemo(
    () => Array.from(new Set([...availableTags, ...(formData.tags || [])])),
    [availableTags, formData.tags]
  )

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
          <button type="button" className="btn btn-ghost btn-sm -ml-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-500">{currentId ? '编辑文章' : '新建文章'}</span>
          <button
            type="button"
            onClick={() => handleSave({ publish: Boolean(formData.draft) })}
            className={`badge ${
              formData.draft
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={formData.draft ? '点击发布' : '点击转为草稿'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                formData.draft ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {formData.draft ? '草稿' : '已发布'}
          </button>
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
          {formData.draft && (
            <button
              type="button"
              className="btn btn-secondary btn-md"
              disabled={saving}
              onClick={() => handleSave({ publish: false })}
            >
              <Save className="h-4 w-4" />
              保存草稿
            </button>
          )}
          {formData.draft ? (
            <button
              type="button"
              className="btn btn-primary btn-md"
              disabled={saving}
              onClick={() => handleSave({ publish: true })}
            >
              <Send className="h-4 w-4" />
              {saving ? '发布中…' : '发布'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-md"
              disabled={saving}
              onClick={() => handleSave()}
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中…' : '保存'}
            </button>
          )}
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
              placeholder="文章标题"
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
            placeholder="开始写作… 支持 Markdown、拖拽或粘贴图片"
            className="h-[68vh] min-h-[520px] xl:h-[calc(100vh-15.5rem)]"
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">发布设置</h2>
              {meta.updatedDate && (
                <span className="text-[11px] text-slate-400">更新于 {formatDate(meta.updatedDate)}</span>
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
                    publishDate: fromInputToPostDate(event.target.value),
                  }))
                }
                className="input"
              />
              <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={setPublishDateNow}>
                现在
              </button>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, pinned: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              置顶文章
            </label>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">摘要与标签</h2>

            <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="description">
              摘要
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, description: event.target.value }))
              }
              placeholder="列表页展示的一句话摘要"
              className="input mt-1.5 resize-none"
            />

            <label className="mt-4 block text-xs font-medium text-slate-500">标签</label>
            <div className="mt-1.5">
              <TagSelector
                value={formData.tags}
                onChange={(tags) => setFormData((previous) => ({ ...previous, tags }))}
                suggestions={tagSuggestions}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">封面图</h2>
            {formData.coverImage?.src ? (
              <div className="mt-3">
                <div className="relative overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={assetsAPI.preview(formData.coverImage.src)}
                    alt={formData.coverImage.alt || '封面图'}
                    className="h-36 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((previous) => ({ ...previous, coverImage: null }))}
                    className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900/80"
                    title="移除封面图"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="btn btn-secondary btn-sm mt-2 w-full"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  更换封面
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="mt-3 flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">选择封面图</span>
              </button>
            )}
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
            {meta.updatedDate && (
              <p className="mt-1.5">上次更新：{formatDateTime(meta.updatedDate)}</p>
            )}
          </section>
        </aside>
      </div>

      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleCoverSelect}
      />

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        type="post"
        data={{ ...formData, id: currentId }}
      />

      <RenameModal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        onRename={handleRename}
        currentPath={currentId}
        title={formData.title}
        type="post"
      />

      <ConfirmDialog
        open={leaveOpen}
        title="离开编辑器？"
        message="当前有未保存的修改，离开后这些修改会丢失。"
        confirmLabel="离开"
        onConfirm={() => {
          setLeaveOpen(false)
          navigate('/posts')
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  )
}

export default PostEditor
