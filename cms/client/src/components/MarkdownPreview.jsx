import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { resolveAssetUrl } from '../utils/url'

const MarkdownPreview = ({ content, className = '', empty = '暂无内容' }) => {
  if (!content || !content.trim()) {
    return <div className={`text-sm text-slate-400 ${className}`}>{empty}</div>
  }

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className: codeClassName, children, ...props }) {
            const match = /language-([\w-]+)/.exec(codeClassName || '')

            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneLight}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                    background: '#f8fafc',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }

            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            )
          },
          img({ src, alt = '', title }) {
            return <img src={resolveAssetUrl(src)} alt={alt} title={title} loading="lazy" />
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownPreview
