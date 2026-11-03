import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const ConfirmDialog = ({
  open,
  title = '确认操作',
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancel?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, loading, onCancel])

  if (!open) return null

  const danger = tone === 'danger'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="card relative w-full max-w-md animate-fadeIn p-6">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              danger ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {message && <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>}
          </div>
          <button type="button" className="btn-icon -mr-2 -mt-2" onClick={onCancel} disabled={loading}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-secondary btn-md" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-md ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
