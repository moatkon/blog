import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  PenLine,
  Plus,
  StickyNote,
  Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { assetsAPI, notesAPI, postsAPI, tagsAPI } from '../services/api'
import { formatDate } from '../utils/date'

const Dashboard = () => {
  const [posts, setPosts] = useState([])
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([postsAPI.getAll(), notesAPI.getAll(), tagsAPI.getAll()])
      .then(([postsResponse, notesResponse, tagsResponse]) => {
        if (cancelled) return
        setPosts(postsResponse.data)
        setNotes(notesResponse.data)
        setTags(tagsResponse.data)
      })
      .catch((error) => {
        console.error('Error loading dashboard data:', error)
        toast.error('加载数据失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const drafts = posts.filter((post) => post.draft)
    return {
      posts: posts.length,
      published: posts.length - drafts.length,
      drafts,
      notes: notes.length,
      tags: tags.length,
    }
  }, [posts, notes, tags])

  const recentPosts = useMemo(
    () =>
      [...posts]
        .sort((a, b) => new Date(b.publishDate || 0) - new Date(a.publishDate || 0))
        .slice(0, 6),
    [posts]
  )

  const today = new Date()
  const greeting =
    today.getHours() < 6
      ? '夜深了'
      : today.getHours() < 12
        ? '早上好'
        : today.getHours() < 18
          ? '下午好'
          : '晚上好'

  if (loading) {
    return (
      <div>
        <div className="skeleton mb-6 h-16 w-2/3 max-w-md" />
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="skeleton h-80 rounded-xl lg:col-span-2" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: '文章',
      value: stats.posts,
      hint: `已发布 ${stats.published}`,
      href: '/posts',
      icon: FileText,
    },
    {
      label: '草稿',
      value: stats.drafts.length,
      hint: '继续未完成的内容',
      href: '/posts?filter=draft',
      icon: PenLine,
    },
    {
      label: '笔记',
      value: stats.notes,
      hint: '随手记录',
      href: '/notes',
      icon: StickyNote,
    },
    {
      label: '标签',
      value: stats.tags,
      hint: '内容分类',
      href: '/tags',
      icon: Tag,
    },
  ]

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">
            {today.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}，Moatkon
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">今天想写点什么？</p>
        </div>
        <Link to="/posts/new" className="btn btn-primary btn-md self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          新建文章
        </Link>
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              to={card.href}
              className="card group flex items-start justify-between p-5 transition-shadow hover:shadow-pop"
            >
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                <Icon className="h-5 w-5" />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">最近文章</h2>
              <p className="mt-0.5 text-xs text-slate-400">按发布时间排序</p>
            </div>
            <Link to="/posts" className="btn btn-ghost btn-sm">
              查看全部
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentPosts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70"
                >
                  <span className="hidden h-10 w-14 shrink-0 overflow-hidden rounded-md border border-slate-100 bg-slate-100 sm:block">
                    {post.coverImage?.src ? (
                      <img
                        src={assetsAPI.preview(post.coverImage.src)}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-slate-300">
                        <FileText className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="clamp-1 block text-sm font-medium text-slate-700 group-hover:text-brand-700">
                      {post.title || '未命名文章'}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {formatDate(post.publishDate, 'yyyy-MM-dd')}
                      {post.updatedDate && ` · 更新 ${formatDate(post.updatedDate, 'yyyy-MM-dd')}`}
                    </span>
                  </span>
                  <span
                    className={`badge shrink-0 ${
                      post.draft ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {post.draft ? '草稿' : '已发布'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              还没有文章，创建第一篇吧
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">快速操作</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/posts/new" className="btn btn-secondary btn-sm justify-start">
                <FileText className="h-3.5 w-3.5 text-brand-600" />
                写文章
              </Link>
              <Link to="/notes/new" className="btn btn-secondary btn-sm justify-start">
                <StickyNote className="h-3.5 w-3.5 text-brand-600" />
                记笔记
              </Link>
              <Link to="/tags/new" className="btn btn-secondary btn-sm justify-start">
                <Tag className="h-3.5 w-3.5 text-brand-600" />
                新建标签
              </Link>
              <Link to="/assets" className="btn btn-secondary btn-sm justify-start">
                <ImageIcon className="h-3.5 w-3.5 text-brand-600" />
                管理资源
              </Link>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">草稿箱</h2>
              <Link to="/posts?filter=draft" className="text-xs text-brand-600 hover:text-brand-700">
                {stats.drafts.length} 篇
              </Link>
            </div>
            {stats.drafts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.drafts.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
                    className="clamp-1 block px-5 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50/70 hover:text-brand-700"
                  >
                    {post.title || '未命名文章'}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-5 py-6 text-center text-xs text-slate-400">暂无草稿</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
