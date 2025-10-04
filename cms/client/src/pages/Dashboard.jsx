import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, StickyNote, Tag, Image, Plus } from 'lucide-react'
import { postsAPI, notesAPI, tagsAPI } from '../services/api'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [stats, setStats] = useState({
    posts: 0,
    notes: 0,
    tags: 0,
    drafts: 0
  })
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [postsRes, notesRes, tagsRes] = await Promise.all([
        postsAPI.getAll(),
        notesAPI.getAll(),
        tagsAPI.getAll()
      ])

      const posts = postsRes.data
      const drafts = posts.filter(post => post.draft).length

      setStats({
        posts: posts.length,
        notes: notesRes.data.length,
        tags: tagsRes.data.length,
        drafts
      })

      setRecentPosts(posts.slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Posts',
      value: stats.posts,
      icon: FileText,
      color: 'bg-blue-500',
      link: '/posts'
    },
    {
      name: 'Notes',
      value: stats.notes,
      icon: StickyNote,
      color: 'bg-green-500',
      link: '/notes'
    },
    {
      name: 'Tags',
      value: stats.tags,
      icon: Tag,
      color: 'bg-purple-500',
      link: '/tags'
    },
    {
      name: '草稿',
      value: stats.drafts,
      icon: FileText,
      color: 'bg-orange-500',
      link: '/posts?filter=draft'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
        <p className="mt-2 text-gray-600">欢迎使用Blog内容管理系统</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.name}
              to={card.link}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 快速操作 */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/posts/new"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建Post
          </Link>
          <Link
            to="/notes/new"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建Note
          </Link>
          <Link
            to="/tags/new"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建Tag
          </Link>
          <Link
            to="/assets"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Image className="h-4 w-4 mr-2" />
            管理资源
          </Link>
        </div>
      </div>

      {/* 最近的Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">最近的Posts</h2>
          <Link
            to="/posts"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            查看全部
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg">
          {recentPosts.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentPosts.map((post) => (
                <li key={post.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {post.title}
                        </h3>
                        {post.draft && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            草稿
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(post.publishDate).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Link
                      to={`/posts/edit/${post.id}`}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      编辑
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">暂无Posts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
