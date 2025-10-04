import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import { postsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Posts = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all') // all, published, draft

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    // 监听URL参数变化
    const filterParam = searchParams.get('filter')
    if (filterParam && filterParam !== filter) {
      setFilter(filterParam)
    }
  }, [searchParams])

  useEffect(() => {
    filterPosts()
  }, [posts, searchTerm, filter])

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getAll()
      setPosts(response.data)
    } catch (error) {
      console.error('Error loading posts:', error)
      toast.error('加载Posts失败')
    } finally {
      setLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts

    // 按状态过滤
    if (filter === 'published') {
      filtered = filtered.filter(post => !post.draft)
    } else if (filter === 'draft') {
      filtered = filtered.filter(post => post.draft)
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPosts(filtered)
  }

  const handleDelete = async (post) => {
    if (!window.confirm(`确定要删除 "${post.title}" 吗？`)) {
      return
    }

    try {
      await postsAPI.delete(post.id)
      toast.success('Post删除成功')
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('删除Post失败')
    }
  }

  const toggleDraft = async (post) => {
    try {
      await postsAPI.update(post.id, { draft: !post.draft })
      toast.success(post.draft ? 'Post已发布' : 'Post已设为草稿')
      loadPosts()
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('更新Post状态失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理你的博客文章，包括草稿和已发布的内容
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建Post
          </Link>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索Posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => {
              const newFilter = e.target.value
              setFilter(newFilter)
              // 更新URL参数
              if (newFilter === 'all') {
                searchParams.delete('filter')
              } else {
                searchParams.set('filter', newFilter)
              }
              setSearchParams(searchParams)
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
      </div>

      {/* Posts列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    封面图
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标签
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    发布日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新日期
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.coverImage && post.coverImage.src ? (
                        <img
                          src={`/api/assets/preview/${post.coverImage.src}`}
                          alt={post.coverImage.alt || '封面图'}
                          className="w-12 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">无</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {post.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleDraft(post)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.draft
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {post.draft ? '草稿' : '已发布'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {post.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags?.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{post.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(post.publishDate), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.updatedDate ? format(new Date(post.updatedDate), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/posts/edit/${post.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' ? '没有找到匹配的Posts' : '暂无Posts'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Posts
