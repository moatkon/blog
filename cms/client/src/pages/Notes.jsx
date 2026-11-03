import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Eye, Pencil, Plus, Search, StickyNote, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { notesAPI } from '../services/api'
import PageHeader from '../components/PageHeader'
import PreviewModal from '../components/PreviewModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDate } from '../utils/date'
import { getNotePreviewUrl } from '../utils/url'

const PAGE_SIZE = 20

const Notes = () => {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [previewNote, setPreviewNote] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    notesAPI
      .getAll()
      .then((response) => {
        if (!cancelled) setNotes(response.data)
      })
      .catch((error) => {
        console.error('Error loading notes:', error)
        toast.error('加载笔记失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const result = notes.filter((note) => {
      if (!keyword) return true
      return (
        String(note.title || '').toLowerCase().includes(keyword) ||
        String(note.description || '').toLowerCase().includes(keyword) ||
        String(note.body || '').toLowerCase().includes(keyword)
      )
    })

    return result.sort(
      (a, b) => new Date(b.publishDate || 0) - new Date(a.publishDate || 0)
    )
  }, [notes, search])

  const visibleNotes = filteredNotes.slice(0, visibleCount)

  const openPreview = async (note) => {
    try {
      const response = await notesAPI.getById(note.id)
      setPreviewNote(response.data)
    } catch (error) {
      console.error('Error loading note for preview:', error)
      toast.error('加载笔记内容失败')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await notesAPI.delete(deleteTarget.id)
      setNotes((previous) => previous.filter((note) => note.id !== deleteTarget.id))
      toast.success('笔记已删除')
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="笔记" description="快速记录想法与片段" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card space-y-2 p-4">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="笔记" description={`${notes.length} 条记录`}>
        <Link to="/notes/new" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" />
          新建笔记
        </Link>
      </PageHeader>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索笔记标题、摘要或内容"
          className="input pl-9"
        />
      </div>

      {visibleNotes.length > 0 ? (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {visibleNotes.map((note) => (
            <article
              key={note.id}
              className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:px-5"
            >
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <StickyNote className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/notes/edit?id=${encodeURIComponent(note.id)}`}
                      className="clamp-1 text-[15px] font-medium text-slate-900 hover:text-brand-700"
                    >
                      {note.title || '未命名笔记'}
                    </Link>
                    {note.description && (
                      <p className="clamp-1 mt-1 text-sm text-slate-500">{note.description}</p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-400">
                      {formatDate(note.publishDate, 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="btn-icon"
                      title="预览"
                      onClick={() => openPreview(note)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hidden sm:inline-flex"
                      title="在博客中打开"
                      onClick={() => window.open(getNotePreviewUrl(note.id), '_blank', 'noopener')}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title="编辑"
                      onClick={() => navigate(`/notes/edit?id=${encodeURIComponent(note.id)}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:bg-red-50 hover:text-red-600"
                      title="删除"
                      onClick={() => setDeleteTarget(note)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100">
            <StickyNote className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-700">
            {search ? '没有匹配的笔记' : '还没有笔记'}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {search ? '换个关键词试试' : '随手记录一条想法'}
          </p>
          {!search && (
            <Link to="/notes/new" className="btn btn-primary btn-md mt-5">
              <Plus className="h-4 w-4" />
              新建笔记
            </Link>
          )}
        </div>
      )}

      {visibleCount < filteredNotes.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            加载更多
            <span className="text-xs text-slate-400">
              {visibleCount} / {filteredNotes.length}
            </span>
          </button>
        </div>
      )}

      <PreviewModal
        isOpen={Boolean(previewNote)}
        onClose={() => setPreviewNote(null)}
        type="note"
        data={previewNote}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除笔记？"
        message={`「${deleteTarget?.title || ''}」将从 src/content/note 中删除，此操作无法撤销。`}
        confirmLabel="删除"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Notes
