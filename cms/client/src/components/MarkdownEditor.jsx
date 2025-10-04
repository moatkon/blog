import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Edit } from 'lucide-react'

const MarkdownEditor = ({ value, onChange, placeholder = "开始写作..." }) => {
  const [isPreview, setIsPreview] = useState(false)

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
      </div>
      
      <div className="min-h-[400px]">
        {isPreview ? (
          <div className="p-4 markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '暂无内容'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[400px] p-4 border-none resize-none focus:outline-none font-mono text-sm"
          />
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
