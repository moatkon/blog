import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X } from 'lucide-react'

const PreviewModal = ({ isOpen, onClose, title, content, type = 'post' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景遮罩 */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>

        {/* 实际的模态框 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {type === 'post' ? 'Post预览' : 'Note预览'}: {title}
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-4 prose prose-gray max-w-none markdown-preview">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-gray-900">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-gray-900">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-base font-medium mb-2 text-gray-900">{children}</h4>,
                      h5: ({ children }) => <h5 className="text-sm font-medium mb-2 text-gray-900">{children}</h5>,
                      h6: ({ children }) => <h6 className="text-xs font-medium mb-2 text-gray-900">{children}</h6>,
                      p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 pl-6 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1 text-gray-700">{children}</li>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 italic text-gray-700">{children}</blockquote>,
                      code: ({ inline, children }) =>
                        inline
                          ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600">{children}</code>
                          : <code className="block bg-gray-100 p-4 rounded overflow-x-auto font-mono text-sm">{children}</code>,
                      pre: ({ children }) => <pre className="mb-4">{children}</pre>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                      a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                      table: ({ children }) => <table className="mb-4 w-full border-collapse border border-gray-300">{children}</table>,
                      thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
                      th: ({ children }) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{children}</th>,
                      td: ({ children }) => <td className="border border-gray-300 px-4 py-2 text-gray-700">{children}</td>,
                      hr: () => <hr className="my-6 border-gray-300" />,
                    }}
                  >
                    {content || '暂无内容'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewModal