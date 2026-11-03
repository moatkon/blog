import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Tag as TagIcon, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { postsAPI, tagsAPI } from '../services/api'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'

const Tags = () => {
  const [tags, setTags] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([tagsAPI.getAll(), postsAPI.getAll()])
      .then(([tagsResponse, postsResponse]) => {
        if (cancelled) return
        setTags(tagsResponse.data)
        setPosts(postsResponse.data)
      })
      .catch((error) => {
        console.error('Error loading tags:', error)
        toast.error('加载标签失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const usage = useMemo(() => {
    const counts = new Map()
    posts.forEach((post) => {
      ;(post.tags || []).forEach((tag) => {
        const key = tag.toLowerCase()
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })
    return counts
  }, [posts])

  const filteredTags = tags.filter((tag) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    return (
      String(tag.name || '').toLowerCase().includes(keyword) ||
      String(tag.title || '').toLowerCase().includes(keyword) ||
      String(tag.description || '').toLowerCase().includes(keyword)
    )
  })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await tagsAPI.delete(deleteTarget.id)
      setTags((previous) => previous.filter((tag) => tag.id !== deleteTarget.id))
      toast.success('标签已删除')
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="标签" description="用标签组织你的文章" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card space-y-3 p-5">
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="标签" description={`${tags.length} 个标签`}>
        <Link to="/tags/new" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" />
          新建标签
        </Link>
      </PageHeader>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索标签"
          className="input pl-9"
        />
      </div>

      {filteredTags.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTags.map((tag) => {
            const count = usage.get(tag.name.toLowerCase()) || 0
            return (
              <div key={tag.id} className="card flex flex-col p-5 transition-shadow hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <TagIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="clamp-1 text-[15px] font-semibold text-slate-900">
                        {tag.title || tag.name}
                      </h2>
                      <p className="clamp-1 text-xs text-slate-400">#{tag.name}</p>
                    </div>
                  </div>
                  <Link
                    to={`/posts?tag=${encodeURIComponent(tag.name)}`}
                    className="badge shrink-0 bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {count} 篇
                  </Link>
                </div>

                <p className="clamp-2 mt-3 min-h-[2.6rem] text-sm leading-6 text-slate-500">
                  {tag.description || '暂无描述'}
                </p>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <Link
                    to={`/tags/edit?id=${encodeURIComponent(tag.id)}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteTarget({ ...tag, count })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100">
            <TagIcon className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-700">
            {search ? '没有匹配的标签' : '还没有标签'}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {search ? '换个关键词试试' : '创建标签，把文章分类整理'}
          </p>
          {!search && (
            <Link to="/tags/new" className="btn btn-primary btn-md mt-5">
              <Plus className="h-4 w-4" />
              新建标签
            </Link>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除标签？"
        message={
          deleteTarget?.count
            ? `「${deleteTarget.name}」正被 ${deleteTarget.count} 篇文章使用。删除标签文件不会移除文章中的标签文字，但标签页会消失。`
            : `「${deleteTarget?.name || ''}」将被删除，此操作无法撤销。`
        }
        confirmLabel="删除"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Tags
