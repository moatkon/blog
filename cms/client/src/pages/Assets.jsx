import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FolderPlus,
  Folder,
  File,
  Image as ImageIcon,
  Trash2,
  Eye,
  Download,
  Search,
  Copy
} from 'lucide-react'
import { assetsAPI } from '../services/api'
import toast from 'react-hot-toast'

const Assets = () => {
  const [assets, setAssets] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    loadAssets()
  }, [currentPath])

  const loadAssets = async () => {
    try {
      const response = currentPath 
        ? await assetsAPI.getFolder(currentPath)
        : await assetsAPI.getAll()
      setAssets(response.data)
    } catch (error) {
      console.error('Error loading assets:', error)
      toast.error('加载资源失败')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = async (acceptedFiles) => {
    setUploading(true)
    
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', currentPath)
        
        await assetsAPI.upload(formData)
        toast.success(`${file.name} 上传成功`)
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`${file.name} 上传失败`)
      }
    }
    
    setUploading(false)
    loadAssets()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  })

  const handleDelete = async (item) => {
    if (!window.confirm(`确定要删除 "${item.name}" 吗？`)) {
      return
    }

    try {
      const itemPath = currentPath ? `/${currentPath}/${item.name}` : item.name
      await assetsAPI.delete(itemPath)
      toast.success('删除成功')
      loadAssets()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('删除失败')
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称')
      return
    }

    try {
      await assetsAPI.createFolder({
        name: newFolderName,
        parent: currentPath
      })
      toast.success('文件夹创建成功')
      setNewFolderName('')
      setShowNewFolderModal(false)
      loadAssets()
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('创建文件夹失败')
    }
  }

  const navigateToFolder = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName
    setCurrentPath(newPath)
  }

  const navigateUp = () => {
    const pathParts = currentPath.split('/')
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const getFileIcon = (item) => {
    if (item.type === 'directory') {
      return <Folder className="h-8 w-8 text-blue-500" />
    }
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
    if (imageExts.includes(item.ext)) {
      return <ImageIcon className="h-8 w-8 text-green-500" />
    }
    
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyFileUrl = async (item) => {
    // 复制基于public目录的绝对路径，用于markdown中引用
    const filePath = currentPath ? `/${currentPath}/${item.name}` : `/${item.name}`

    try {
      await navigator.clipboard.writeText(filePath)
      toast.success(`已复制路径: ${filePath}`)
    } catch (error) {
      // 如果clipboard API不可用，使用fallback方法
      const textArea = document.createElement('textarea')
      textArea.value = filePath
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success(`已复制路径: ${filePath}`)
    }
  }

  const filteredAssets = assets.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">静态资源管理</h1>
        <p className="mt-2 text-sm text-gray-700">
          管理你的图片、文档和其他静态资源
        </p>
      </div>

      {/* 路径导航 */}
      <div className="mb-4 flex items-center space-x-2 text-sm">
        <button
          onClick={() => setCurrentPath('')}
          className="text-blue-600 hover:text-blue-800"
        >
          根目录
        </button>
        {currentPath.split('/').filter(Boolean).map((part, index, array) => (
          <React.Fragment key={index}>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => {
                const newPath = array.slice(0, index + 1).join('/')
                setCurrentPath(newPath)
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            新建文件夹
          </button>
          {currentPath && (
            <button
              onClick={navigateUp}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              返回上级
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive 
            ? '拖放文件到这里...' 
            : '拖放文件到这里，或点击选择文件'}
        </p>
        {uploading && (
          <div className="mt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-1">上传中...</p>
          </div>
        )}
      </div>

      {/* 文件列表 */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((item) => (
            <div key={item.name} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                {getFileIcon(item)}
                <div className="flex space-x-1">
                  {item.type === 'file' && (
                    <>
                      <button
                        onClick={() => {
                          const previewPath = currentPath ? `${currentPath}/${item.name}` : item.name
                          window.open(assetsAPI.preview(previewPath), '_blank')
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => copyFileUrl(item)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="复制文件路径（用于markdown）"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (item.type === 'directory') {
                    navigateToFolder(item.name)
                  }
                }}
              >
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {item.type === 'file' 
                    ? formatFileSize(item.size)
                    : '文件夹'
                  }
                </p>
                {item.modifiedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.modifiedAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? '没有找到匹配的文件' : '文件夹为空'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!searchTerm && '上传一些文件开始使用吧'}
          </p>
        </div>
      )}

      {/* 新建文件夹模态框 */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                新建文件夹
              </h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入文件夹名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowNewFolderModal(false)
                    setNewFolderName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assets
