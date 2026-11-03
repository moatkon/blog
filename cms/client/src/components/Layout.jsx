import React, { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  StickyNote,
  Tags,
  X,
} from 'lucide-react'
import { BLOG_DEV_URL } from '../utils/url'

const navigation = [
  { name: '概览', href: '/', icon: LayoutDashboard, end: true },
  { name: '文章', href: '/posts', icon: FileText },
  { name: '笔记', href: '/notes', icon: StickyNote },
  { name: '标签', href: '/tags', icon: Tags },
  { name: '资源', href: '/assets', icon: ImageIcon },
]

const Brand = () => (
  <Link to="/" className="flex items-center gap-3">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm">
      M
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold leading-5 text-slate-900">Moatkon CMS</span>
      <span className="block text-[11px] leading-4 text-slate-400">博客内容管理</span>
    </span>
  </Link>
)

const NavItems = ({ onNavigate }) => (
  <nav className="space-y-1">
    {navigation.map((item) => {
      const Icon = item.icon
      return (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-[18px] w-[18px] ${
                  isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {item.name}
            </>
          )}
        </NavLink>
      )
    })}
  </nav>
)

const BlogLink = ({ online }) => (
  <a
    href={BLOG_DEV_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
  >
    <span className="flex items-center gap-2.5">
      <span
        className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300'}`}
        title={online ? '博客开发服务器运行中' : '博客开发服务器未启动'}
      />
      <span>
        <span className="block text-xs font-medium text-slate-700">打开博客</span>
        <span className="block text-[11px] text-slate-400">
          {online ? 'localhost:4321 运行中' : 'localhost:4321 未启动'}
        </span>
      </span>
    </span>
    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
  </a>
)

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [blogOnline, setBlogOnline] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkBlogStatus = () => {
      fetch('/api/blog-status')
        .then((response) => response.json())
        .then((data) => {
          if (!cancelled) setBlogOnline(Boolean(data.online))
        })
        .catch(() => {
          if (!cancelled) setBlogOnline(false)
        })
    }

    checkBlogStatus()
    const timer = setInterval(checkBlogStatus, 15000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="section-title mb-2 px-3">内容</p>
          <NavItems />
        </div>
        <div className="border-t border-slate-100 p-3">
          <BlogLink online={blogOnline} />
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
        <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-pop">
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
            <Brand />
            <button type="button" className="btn-icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <p className="section-title mb-2 px-3">内容</p>
            <NavItems onNavigate={() => setSidebarOpen(false)} />
          </div>
          <div className="border-t border-slate-100 p-3">
            <BlogLink online={blogOnline} />
          </div>
        </div>
      </div>

      <div className="lg:pl-60">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button type="button" className="btn-icon -ml-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Brand />
          <a
            href={BLOG_DEV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-icon -mr-2"
            title="打开博客"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </header>

        <main>
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
