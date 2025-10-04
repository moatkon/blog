import React, { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Edit, Image, Upload } from 'lucide-react'
import { assetsAPI } from '../services/api'
import toast from 'react-hot-toast'

const MarkdownEditor = ({ value, onChange, placeholder = "开始写作..." }) => {
  const [isPreview, setIsPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)

    for (const file of files) {
      // 检查是否为图片文件
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是图片文件`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'images') // 上传到images文件夹

        const response = await assetsAPI.upload(formData)
        const imageUrl = `/api/assets/preview/${response.data.file.path}`

        // 插入markdown图片语法到当前光标位置
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const imageMarkdown = `![${file.name}](${imageUrl})`
          const newValue = value.substring(0, start) + imageMarkdown + value.substring(end)
          onChange(newValue)

          // 设置光标位置到插入内容之后
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length)
          }, 0)
        }

        toast.success(`${file.name} 上传成功`)
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(`${file.name} 上传失败`)
      }
    }

    setUploading(false)
  }

  const handleFileInputChange = (e) => {
    handleImageUpload(e.target.files)
    e.target.value = '' // 清空input，允许重复上传同一文件
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    handleImageUpload(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-300">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`flex items-center px-3 py-1 text-sm rounded ${
              !isPreview
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`flex items-center px-3 py-1 text-sm rounded ${
              isPreview
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4 mr-1" />
            预览
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            title="上传图片"
          >
            {uploading ? (
              <Upload className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Image className="w-4 h-4 mr-1" />
            )}
            {uploading ? '上传中...' : '图片'}
          </button>
        </div>
      </div>
      
      <div className="min-h-[400px]">
        {isPreview ? (
          <div className="p-4 markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '暂无内容'}
            </ReactMarkdown>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative"
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-[400px] p-4 border-none resize-none focus:outline-none font-mono text-sm"
            />
            {uploading && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center">
                <div className="text-blue-600 text-sm">
                  <Upload className="w-6 h-6 animate-spin mx-auto mb-2" />
                  正在上传图片...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
