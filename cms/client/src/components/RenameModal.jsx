import React, { useEffect, useState } from 'react'
import { FileText, X } from 'lucide-react'

const RenameModal = ({ isOpen, onClose, onRename, currentPath, title, type = 'post' }) => {
  const [newPath, setNewPath] = useState(currentPath || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setNewPath(currentPath || '')
    setError('')
    setLoading(false)
  }, [isOpen, currentPath])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, loading, onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!newPath.trim() || newPath.trim() === currentPath) {
      onClose()
      return
    }

    setLoading(true)
    try {
      await onRename(newPath.trim())
      onClose()
    } catch (renameError) {
      setError(renameError.response?.data?.error || '重命名失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="card relative w-full max-w-md animate-fadeIn p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              重命名{type === 'post' ? '文章' : '笔记'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">修改文件路径会影响文章 URL</p>
          </div>
          <button type="button" className="btn-icon -mr-2 -mt-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileText className="h-3.5 w-3.5" />
            当前路径
          </div>
          <p className="mt-1 break-all font-mono text-xs text-slate-600">{currentPath}</p>
        </div>

        <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="newPath">
          新的路径 / 文件名
        </label>
        <input
          id="newPath"
          value={newPath}
          onChange={(event) => setNewPath(event.target.value)}
          className="input mt-1.5 font-mono text-xs"
          placeholder={type === 'post' ? '2026/11/03/index.md' : '2026/11/03/index.md'}
          autoFocus
        />
        <p className="mt-1.5 text-[11px] text-slate-400">
          {type === 'post'
            ? '例如 2024/01/01/index.md 或 2024/01/01/1.md'
            : '例如 2024/01/01/index.md'}
        </p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="btn btn-secondary btn-md" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading || !newPath.trim()}>
            {loading ? '重命名中…' : '重命名'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RenameModal
