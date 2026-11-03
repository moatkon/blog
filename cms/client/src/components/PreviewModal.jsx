import React, { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import MarkdownPreview from './MarkdownPreview'
import { assetsAPI } from '../services/api'
import { formatDate } from '../utils/date'
import { getNotePreviewUrl, getPostPreviewUrl } from '../utils/url'

const PreviewModal = ({ isOpen, onClose, title, content, type = 'post', data }) => {
  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const displayTitle = data?.title || title
  const body = data?.body ?? content
  const cover = data?.coverImage?.src
  const tags = data?.tags || []
  const externalUrl = data?.id
    ? type === 'post'
      ? getPostPreviewUrl(data.id)
      : getNotePreviewUrl(data.id)
    : ''

  return (
    <div className="fixed inset-0 z-[65] overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative mx-auto my-6 w-[calc(100%-1.5rem)] max-w-3xl animate-fadeIn sm:my-10">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="badge bg-slate-100 text-slate-600">
                {type === 'post' ? '文章预览' : '笔记预览'}
              </span>
              {data?.draft && <span className="badge bg-amber-50 text-amber-700">草稿</span>}
            </div>
            <div className="flex items-center gap-1">
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="在博客站点中打开（需要本地博客服务运行）"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  在博客中打开
                </a>
              )}
              <button type="button" className="btn-icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
            {cover && (
              <img
                src={assetsAPI.preview(cover)}
                alt={data?.coverImage?.alt || displayTitle}
                className="max-h-[320px] w-full object-cover"
              />
            )}

            <div className="px-6 py-6 sm:px-8">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {displayTitle || '未命名'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>{formatDate(data?.publishDate || new Date(), 'yyyy 年 M 月 d 日')}</span>
                {data?.updatedDate && <span>更新于 {formatDate(data.updatedDate, 'yyyy-MM-dd')}</span>}
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="badge bg-brand-50 text-brand-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {data?.description && (
                <p className="mt-4 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-500">
                  {data.description}
                </p>
              )}

              <div className="mt-8 border-t border-slate-100 pt-8">
                <MarkdownPreview content={body} empty="暂无内容" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewModal
