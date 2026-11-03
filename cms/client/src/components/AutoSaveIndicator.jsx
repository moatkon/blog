import React from 'react'
import { AlertCircle, CheckCircle, Clock, Loader, Save } from 'lucide-react'
import { format } from 'date-fns'
import { AUTO_SAVE_STATUS } from '../hooks/useAutoSave'

const AutoSaveIndicator = ({ status, lastSaved, dirty = false, localDraft = false, className = '' }) => {
  let icon = <Save className="h-3.5 w-3.5" />
  let text = dirty ? '未保存' : '已保存'
  let tone = 'text-slate-400'

  if (status === AUTO_SAVE_STATUS.SAVING) {
    icon = <Loader className="h-3.5 w-3.5 animate-spin" />
    text = '保存中…'
    tone = 'text-brand-600'
  } else if (status === AUTO_SAVE_STATUS.PENDING) {
    icon = <Clock className="h-3.5 w-3.5" />
    text = '待保存…'
    tone = 'text-amber-600'
  } else if (status === AUTO_SAVE_STATUS.ERROR) {
    icon = <AlertCircle className="h-3.5 w-3.5" />
    text = '保存失败'
    tone = 'text-red-600'
  } else if (status === AUTO_SAVE_STATUS.SUCCESS) {
    icon = <CheckCircle className="h-3.5 w-3.5" />
    text = `${localDraft ? '本地草稿已保存' : '已保存'}${
      lastSaved ? ` · ${format(lastSaved, 'HH:mm')}` : ''
    }`
    tone = 'text-emerald-600'
  } else if (!dirty) {
    icon = <CheckCircle className="h-3.5 w-3.5" />
    text = lastSaved ? '已保存' : '未保存'
    tone = 'text-slate-400'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone} ${className}`}>
      {icon}
      {text}
    </span>
  )
}

export default AutoSaveIndicator
