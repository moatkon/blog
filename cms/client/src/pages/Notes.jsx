import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, Search, FileText } from 'lucide-react'
import { notesAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import PreviewModal from '../components/PreviewModal'
import RenameModal from '../components/RenameModal'

const Notes = () => {
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewNote, setPreviewNote] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [renameNote, setRenameNote] = useState(null)
  const [showRenameModal, setShowRenameModal] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  useEffect(() => {
    filterNotes()
  }, [notes, searchTerm])

  const loadNotes = async () => {
    try {
      const response = await notesAPI.getAll()
      setNotes(response.data)
    } catch (error) {
      console.error('Error loading notes:', error)
      toast.error('加载Notes失败')
    } finally {
      setLoading(false)
    }
  }

  const filterNotes = () => {
    let filtered = notes

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.description && note.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredNotes(filtered)
  }

  const handleDelete = async (note) => {
    if (!window.confirm(`确定要删除 \"${note.title}\" 吗？`)) {
      return
    }

    try {
      await notesAPI.delete(note.id)
      toast.success('Note删除成功')
      loadNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('删除Note失败')
    }
  }

  const handlePreview = async (note) => {
    try {
      // 获取完整的note数据（包括body内容）
      const response = await notesAPI.getById(note.id)
      setPreviewNote(response.data)
      setShowPreviewModal(true)
    } catch (error) {
      console.error('Error loading note for preview:', error)
      toast.error('加载Note内容失败')
    }
  }

  const handleRename = async (note) => {
    setRenameNote(note);
    setShowRenameModal(true);
  };

  const onRenameSubmit = async (newPath) => {
    try {
      await notesAPI.rename(renameNote.id, { newPath });
      toast.success('路径更新成功');
      loadNotes(); // 重新加载notes列表
      setShowRenameModal(false);
    } catch (error) {
      console.error('Error renaming note:', error);
      throw error;
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
          <h1 className="text-2xl font-bold text-gray-900">Notes管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理你的笔记和想法
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/notes/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建Note
          </Link>
        </div>
      </div>

      {/* 搜索 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full max-w-md border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Notes列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredNotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    路径/文件名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    发布日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    修改日期
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {note.title}
                        </div>
                        {note.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {note.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {note.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(note.publishDate), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(note.modifiedAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(note)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="预览Note"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRename(note)}
                          className="text-purple-600 hover:text-purple-900"
                          title="重命名文件"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/notes/edit/${note.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(note)}
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
              {searchTerm ? '没有找到匹配的Notes' : '暂无Notes'}
            </p>
          </div>
        )}
      </div>

      {/* 预览模态框 */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={previewNote?.title || ''}
        content={previewNote?.body || ''}
        type="note"
      />
      
      {/* 重命名模态框 */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={onRenameSubmit}
        currentPath={renameNote?.id}
        title={renameNote?.title}
        type="note"
      />
    </div>
  )
}

export default Notes