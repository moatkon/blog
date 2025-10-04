import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react'
import { tagsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Tags = () => {
  const [tags, setTags] = useState([])
  const [filteredTags, setFilteredTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    filterTags()
  }, [tags, searchTerm])

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getAll()
      setTags(response.data)
    } catch (error) {
      console.error('Error loading tags:', error)
      toast.error('加载Tags失败')
    } finally {
      setLoading(false)
    }
  }

  const filterTags = () => {
    let filtered = tags

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tag.title && tag.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredTags(filtered)
  }

  const handleDelete = async (tag) => {
    if (!window.confirm(`确定要删除标签 "${tag.name}" 吗？`)) {
      return
    }

    try {
      await tagsAPI.delete(tag.id)
      toast.success('Tag删除成功')
      loadTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('删除Tag失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理你的标签，用于分类和组织内容
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/tags/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建Tag
          </Link>
        </div>
      </div>

      {/* 搜索 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索Tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full max-w-md border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Tags网格 */}
      {filteredTags.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTags.map((tag) => (
            <div key={tag.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Tag className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {tag.title || tag.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {tag.name}
                    </p>
                  </div>
                </div>
                
                {tag.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {tag.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  创建于 {format(new Date(tag.createdAt), 'yyyy-MM-dd')}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <Link
                    to={`/tags/edit/${tag.id}`}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? '没有找到匹配的Tags' : '暂无Tags'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!searchTerm && '开始创建你的第一个标签吧'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/tags/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建Tag
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Tags
