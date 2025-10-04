import React, { useState, useEffect } from 'react'
import { X, Upload, Folder, ArrowLeft, Image as ImageIcon, Edit3, Trash2 } from 'lucide-react'
import { assetsAPI } from '../services/api'
import toast from 'react-hot-toast'

const ImagePickerModal = ({ isOpen, onClose, onSelectImage }) => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameItem, setRenameItem] = useState(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadAssets()
    }
  }, [isOpen, currentPath])

  const loadAssets = async () => {
    setLoading(true)
    try {
      let response
      if (currentPath) {
        response = await assetsAPI.getFolder(currentPath)
        setAssets(response.data)
      } else {
        response = await assetsAPI.getAll()
        // 对于根目录，只显示顶级项目，不显示嵌套的children
        const rootItems = response.data.map(item => ({
          name: item.name,
          type: item.type,
          path: item.path,
          size: item.size,
          createdAt: item.createdAt,
          modifiedAt: item.modifiedAt,
          ext: item.ext
        }))
        setAssets(rootItems)
      }
    } catch (error) {
      console.error('Error loading assets:', error)
      toast.error(`加载资源失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', currentPath || 'images')

        await assetsAPI.upload(formData)
      }
      toast.success('上传成功')
      loadAssets() // 重新加载资源列表
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleFolderClick = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName
    setCurrentPath(newPath)
  }

  const handleBackClick = () => {
    const pathParts = currentPath.split('/')
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const handleImageSelect = (item) => {
    const imagePath = currentPath ? `${currentPath}/${item.name}` : item.name
    onSelectImage(imagePath)
    onClose()
  }

  const handleRename = (item, e) => {
    e.stopPropagation() // 防止触发选择事件
    setRenameItem(item)
    setNewName(item.name)
    setShowRenameModal(true)
  }

  const executeRename = async () => {
    if (!renameItem || !newName.trim()) return

    try {
      const itemPath = currentPath ? `${currentPath}/${renameItem.name}` : renameItem.name
      await assetsAPI.rename(itemPath, newName.trim())
      toast.success('重命名成功')
      setShowRenameModal(false)
      setRenameItem(null)
      setNewName('')
      loadAssets()
    } catch (error) {
      console.error('Error renaming item:', error)
      toast.error(error.response?.data?.error || '重命名失败')
    }
  }

  const handleDelete = async (item, e) => {
    e.stopPropagation() // 防止触发选择事件

    if (!window.confirm(`确定要删除 "${item.name}" 吗？`)) {
      return
    }

    try {
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name
      await assetsAPI.delete(itemPath)
      toast.success('删除成功')
      loadAssets()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('删除失败')
    }
  }

  const isImage = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp']
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">选择图片</h2>
            {currentPath && (
              <span className="text-sm text-gray-500">/ {currentPath}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            {currentPath && (
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>返回上级</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>{uploading ? '上传中...' : '上传图片'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {assets.map((item, index) => (
                <div key={index} className="group">
                  {item.type === 'directory' ? (
                    <div className="relative group">
                      <div
                        onClick={() => handleFolderClick(item.name)}
                        className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                      >
                        <Folder className="h-12 w-12 text-blue-500 mb-2" />
                        <span className="text-sm text-center break-all">{item.name}</span>
                      </div>
                      {/* 操作按钮 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button
                          onClick={(e) => handleRename(item, e)}
                          className="p-1 bg-white rounded shadow hover:bg-gray-50"
                          title="重命名"
                        >
                          <Edit3 className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          className="p-1 bg-white rounded shadow hover:bg-gray-50"
                          title="删除"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ) : isImage(item.name) ? (
                    <div
                      onClick={() => handleImageSelect(item)}
                      className="relative cursor-pointer group"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-colors">
                        <img
                          src={assetsAPI.preview(currentPath ? `${currentPath}/${item.name}` : item.name)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center bg-gray-200">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                          选择
                        </span>
                      </div>
                      {/* 操作按钮 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button
                          onClick={(e) => handleRename(item, e)}
                          className="p-1 bg-white rounded shadow hover:bg-gray-50"
                          title="重命名"
                        >
                          <Edit3 className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          className="p-1 bg-white rounded shadow hover:bg-gray-50"
                          title="删除"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-center break-all">{item.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="h-12 w-12 bg-gray-300 rounded mb-2 flex items-center justify-center">
                        <span className="text-xs text-gray-600">FILE</span>
                      </div>
                      <span className="text-sm text-center break-all text-gray-600">{item.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="h-16 w-16 mb-4" />
              <p>当前目录没有文件</p>
              <p className="text-sm">点击上传按钮添加图片</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      {/* 重命名弹窗 */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              重命名 {renameItem?.type === 'directory' ? '文件夹' : '文件'}
            </h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入新名称"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  executeRename()
                }
              }}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setRenameItem(null)
                  setNewName('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={executeRename}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重命名
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImagePickerModal
