import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Eye,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { assetsAPI, postsAPI } from '../services/api'
import PageHeader from '../components/PageHeader'
import PreviewModal from '../components/PreviewModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDate } from '../utils/date'
import { getPostPreviewUrl } from '../utils/url'

const PAGE_SIZE = 20

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿' },
]

const Posts = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(() => {
    const value = searchParams.get('filter')
    return ['draft', 'published'].includes(value) ? value : 'all'
  })
  const [tagFilter, setTagFilter] = useState(() => searchParams.get('tag') || '')
  const [sort, setSort] = useState('publish-desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [previewPost, setPreviewPost] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    postsAPI
      .getAll()
      .then((response) => {
        if (!cancelled) setPosts(response.data)
      })
      .catch((error) => {
        console.error('Error loading posts:', error)
        toast.error('加载文章失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const next = new URLSearchParams()
    if (filter !== 'all') next.set('filter', filter)
    if (tagFilter) next.set('tag', tagFilter)
    setSearchParams(next, { replace: true })
  }, [filter, tagFilter, setSearchParams])

  useEffect(() => {
    const filterParam = searchParams.get('filter')
    const nextFilter = ['draft', 'published'].includes(filterParam) ? filterParam : 'all'
    const nextTag = searchParams.get('tag') || ''

    setFilter((previous) => (previous === nextFilter ? previous : nextFilter))
    setTagFilter((previous) => (previous === nextTag ? previous : nextTag))
  }, [searchParams])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, filter, tagFilter, sort])

  const tagCounts = useMemo(() => {
    const counts = new Map()
    posts.forEach((post) => {
      ;(post.tags || []).forEach((tag) => {
        const key = tag.toLowerCase()
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })
    return counts
  }, [posts])

  const tags = useMemo(
    () =>
      Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort((a, b) =>
        a.localeCompare(b, 'zh-CN')
      ),
    [posts]
  )

  const stats = useMemo(
    () => ({
      all: posts.length,
      published: posts.filter((post) => !post.draft).length,
      draft: posts.filter((post) => post.draft).length,
    }),
    [posts]
  )

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const result = posts.filter((post) => {
      if (filter === 'published' && post.draft) return false
      if (filter === 'draft' && !post.draft) return false
      if (tagFilter && !(post.tags || []).some((tag) => tag.toLowerCase() === tagFilter.toLowerCase())) {
        return false
      }
      if (!keyword) return true

      return (
        String(post.title || '').toLowerCase().includes(keyword) ||
        String(post.description || '').toLowerCase().includes(keyword) ||
        (post.tags || []).some((tag) => tag.toLowerCase().includes(keyword))
      )
    })

    return result.sort((a, b) => {
      if (sort === 'title') return String(a.title).localeCompare(String(b.title), 'zh-CN')
      if (sort === 'updated-desc') {
        return new Date(b.updatedDate || b.publishDate || 0) - new Date(a.updatedDate || a.publishDate || 0)
      }
      return new Date(b.publishDate || 0) - new Date(a.publishDate || 0)
    })
  }, [posts, filter, tagFilter, search, sort])

  const visiblePosts = filteredPosts.slice(0, visibleCount)

  const openPreview = async (post) => {
    try {
      const response = await postsAPI.getById(post.id)
      setPreviewPost(response.data)
    } catch (error) {
      console.error('Error loading post for preview:', error)
      toast.error('加载文章内容失败')
    }
  }

  const toggleDraft = async (post) => {
    try {
      await postsAPI.update(post.id, { draft: !post.draft })
      setPosts((previous) =>
        previous.map((item) =>
          item.id === post.id
            ? { ...item, draft: !item.draft, updatedDate: new Date().toISOString() }
            : item
        )
      )
      toast.success(post.draft ? '文章已发布' : '文章已转为草稿')
    } catch (error) {
      console.error('Error updating post status:', error)
      toast.error('更新状态失败')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await postsAPI.delete(deleteTarget.id)
      setPosts((previous) => previous.filter((post) => post.id !== deleteTarget.id))
      toast.success('文章已删除')
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="文章" description="管理博客文章、草稿与发布状态" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card flex items-center gap-4 p-4">
              <div className="skeleton h-16 w-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-2/3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="文章" description={`${stats.all} 篇文章 · ${stats.draft} 篇草稿`}>
        <Link to="/posts/new" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" />
          新建文章
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-slate-400">{stats[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索标题、摘要或标签"
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="input h-[38px] w-36 appearance-none py-1.5 pl-8 pr-7 text-xs sm:w-40"
            >
              <option value="">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}（{tagCounts.get(tag.toLowerCase()) || 0}）
                </option>
              ))}
            </select>
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="input h-[38px] w-32 py-1.5 text-xs sm:w-36"
          >
            <option value="publish-desc">最新发布</option>
            <option value="updated-desc">最近更新</option>
            <option value="title">按标题</option>
          </select>
        </div>
      </div>

      {visiblePosts.length > 0 ? (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              className="group flex gap-4 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:px-5"
            >
              <Link
                to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
                className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 sm:block"
              >
                {post.coverImage?.src ? (
                  <img
                    src={assetsAPI.preview(post.coverImage.src)}
                    alt={post.coverImage.alt || post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-slate-300">
                    <FileText className="h-6 w-6" />
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
                      className="clamp-1 text-[15px] font-medium text-slate-900 hover:text-brand-700"
                    >
                      {post.title || '未命名文章'}
                    </Link>
                    {post.description && (
                      <p className="clamp-1 mt-1 text-sm text-slate-500">{post.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                      {(post.tags || []).slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTagFilter(tag)}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {tag}
                        </button>
                      ))}
                      <span>{formatDate(post.publishDate)}</span>
                      {post.updatedDate && <span>· 更新 {formatDate(post.updatedDate)}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleDraft(post)}
                      className={`badge mr-1 hidden sm:inline-flex ${
                        post.draft
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={post.draft ? '点击发布' : '点击转为草稿'}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          post.draft ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                      {post.draft ? '草稿' : '已发布'}
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title="预览"
                      onClick={() => openPreview(post)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hidden sm:inline-flex"
                      title="在博客中打开"
                      onClick={() => window.open(getPostPreviewUrl(post.id), '_blank', 'noopener')}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title="编辑"
                      onClick={() => navigate(`/posts/edit?id=${encodeURIComponent(post.id)}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:bg-red-50 hover:text-red-600"
                      title="删除"
                      onClick={() => setDeleteTarget(post)}
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
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-700">
            {search || tagFilter || filter !== 'all' ? '没有匹配的文章' : '还没有文章'}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {search || tagFilter || filter !== 'all'
              ? '试试调整搜索词或筛选条件'
              : '创建第一篇文章，开始记录你的想法'}
          </p>
          {!search && !tagFilter && filter === 'all' && (
            <Link to="/posts/new" className="btn btn-primary btn-md mt-5">
              <Plus className="h-4 w-4" />
              新建文章
            </Link>
          )}
        </div>
      )}

      {visibleCount < filteredPosts.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            加载更多
            <span className="text-xs text-slate-400">
              {visibleCount} / {filteredPosts.length}
            </span>
          </button>
        </div>
      )}

      <PreviewModal
        isOpen={Boolean(previewPost)}
        onClose={() => setPreviewPost(null)}
        type="post"
        data={previewPost}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除文章？"
        message={`「${deleteTarget?.title || ''}」将从 src/content/post 中删除，此操作无法撤销。`}
        confirmLabel="删除"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Posts
