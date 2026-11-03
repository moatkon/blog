import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bold,
  Code,
  Columns,
  Eye,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Pencil,
  Quote,
  Strikethrough,
  Table,
  Upload,
} from 'lucide-react'
import toast from 'react-hot-toast'
import MarkdownPreview from './MarkdownPreview'
import ImagePickerModal from './ImagePickerModal'
import { assetsAPI } from '../services/api'

const ToolbarButton = ({ title, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
  >
    {children}
  </button>
)

const Divider = () => <span className="mx-1 h-4 w-px bg-slate-200" />

const MarkdownEditor = ({
  value = '',
  onChange,
  placeholder = '开始写作…',
  onSave,
  className = '',
  expandedDefault = false,
}) => {
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1280 ? 'split' : 'edit'
  )
  const [canSplit, setCanSplit] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [expanded, setExpanded] = useState(expandedDefault)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)

  useEffect(() => {
    const onResize = () => {
      const allowed = window.innerWidth >= 1024
      setCanSplit(allowed)
      if (!allowed) setMode((current) => (current === 'split' ? 'edit' : current))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const stats = useMemo(() => {
    const plain = String(value)
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#>*`~\-[\]()!]/g, ' ')
    const chars = plain.replace(/\s/g, '').length
    return { chars, minutes: Math.max(1, Math.ceil(chars / 400)) }
  }, [value])

  const replaceSelection = (before, after = '', fallback = '') => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange(`${value}${before}${fallback}${after}`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end) || fallback
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const applyLinePrefix = (prefix, { replaceHeading = false } = {}) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineEndIndex = value.indexOf('\n', end)
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
    const block = value.slice(lineStart, lineEnd)
    const lines = block.split('\n')

    const cleaned = replaceHeading
      ? lines.map((line) => line.replace(/^#{1,6}\s+/, ''))
      : lines
    const allPrefixed = cleaned.every((line) => line.startsWith(prefix))
    const nextLines = cleaned.map((line) =>
      allPrefixed ? line.slice(prefix.length) : `${prefix}${line}`
    )
    const nextBlock = nextLines.join('\n')
    const next = `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`
    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart, lineStart + nextBlock.length)
    })
  }

  const insertTextAtCursor = (text) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange(`${value}${text}`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`
    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    })
  }

  const uploadFiles = async (files) => {
    const images = Array.from(files || []).filter((file) => file.type.startsWith('image/'))
    if (!images.length) {
      toast.error('只能插入图片文件')
      return
    }

    setUploading(true)
    const now = new Date()
    const folder = `images/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

    try {
      const snippets = []

      for (const file of images) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const response = await assetsAPI.upload(formData)
        const path = String(response.data.file.path).replace(/^\/+/, '')
        const alt = file.name.replace(/\.[^.]+$/, '')
        snippets.push(`![${alt}](/${path})`)
      }

      insertTextAtCursor(`${snippets.length ? '\n' : ''}${snippets.join('\n')}\n`)
      toast.success(`已插入 ${snippets.length} 张图片`)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('图片上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleKeyDown = (event) => {
    const modifier = event.metaKey || event.ctrlKey
    const key = event.key.toLowerCase()

    if (modifier && key === 's') {
      event.preventDefault()
      onSave?.()
      return
    }
    if (modifier && key === 'b') {
      event.preventDefault()
      replaceSelection('**', '**', '粗体')
      return
    }
    if (modifier && key === 'i') {
      event.preventDefault()
      replaceSelection('*', '*', '斜体')
      return
    }
    if (modifier && key === 'k') {
      event.preventDefault()
      replaceSelection('[', '](https://)', '链接文字')
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      insertTextAtCursor('  ')
    }
  }

  const handlePaste = (event) => {
    const images = Array.from(event.clipboardData?.files || []).filter((file) =>
      file.type.startsWith('image/')
    )
    if (images.length) {
      event.preventDefault()
      uploadFiles(images)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    if (event.dataTransfer?.files?.length) {
      uploadFiles(event.dataTransfer.files)
    }
  }

  const insertFromPicker = (path) => {
    const normalized = String(path).replace(/^\/+/, '')
    insertTextAtCursor(`![图片](/${normalized})`)
    setShowImagePicker(false)
  }

  const showEditor = mode !== 'preview'
  const showPreview = mode === 'preview' || (mode === 'split' && canSplit)

  return (
    <div
      className={[
        'card flex flex-col overflow-hidden',
        expanded ? 'fixed inset-3 z-[60] shadow-pop' : '',
        className || 'h-full min-h-[520px]',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-1.5">
        <div className="flex min-w-0 items-center overflow-x-auto">
          <ToolbarButton title="二级标题" onClick={() => applyLinePrefix('## ', { replaceHeading: true })}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="粗体 (⌘B)" onClick={() => replaceSelection('**', '**', '粗体')}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="斜体 (⌘I)" onClick={() => replaceSelection('*', '*', '斜体')}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="删除线" onClick={() => replaceSelection('~~', '~~', '文本')}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="行内代码" onClick={() => replaceSelection('`', '`', 'code')}>
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="引用" onClick={() => applyLinePrefix('> ')}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="无序列表" onClick={() => applyLinePrefix('- ')}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="有序列表" onClick={() => applyLinePrefix('1. ')}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="任务列表" onClick={() => applyLinePrefix('- [ ] ')}>
            <ListChecks className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            title="链接 (⌘K)"
            onClick={() => replaceSelection('[', '](https://)', '链接文字')}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="插入图片" onClick={() => setShowImagePicker(true)}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="上传图片" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="代码块"
            onClick={() => replaceSelection('\n```\n', '\n```\n', "console.log('hello')")}
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="表格"
            onClick={() =>
              insertTextAtCursor('\n| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |\n')
            }
          >
            <Table className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="分割线" onClick={() => insertTextAtCursor('\n---\n')}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ModeButton active={mode === 'edit'} title="编辑" onClick={() => setMode('edit')}>
            <Pencil className="h-4 w-4" />
          </ModeButton>
          {canSplit && (
            <ModeButton active={mode === 'split'} title="分屏" onClick={() => setMode('split')}>
              <Columns className="h-4 w-4" />
            </ModeButton>
          )}
          <ModeButton active={mode === 'preview'} title="预览" onClick={() => setMode('preview')}>
            <Eye className="h-4 w-4" />
          </ModeButton>
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <ToolbarButton
            title={expanded ? '退出全屏' : '全屏写作'}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolbarButton>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {showEditor && (
          <div
            className={[
              'flex min-h-0 min-w-0 flex-1 flex-col',
              mode === 'split' ? 'lg:w-1/2' : 'w-full',
              showPreview ? 'max-lg:hidden' : '',
            ].join(' ')}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              spellCheck={false}
              className="markdown-source editor-scroll h-full min-h-[420px] w-full flex-1 resize-none border-0 bg-white p-5 focus:outline-none"
            />
          </div>
        )}

        {showEditor && showPreview && <div className="hidden w-px bg-slate-200 lg:block" />}

        {showPreview && (
          <div
            className={[
              'editor-scroll min-h-0 flex-1 overflow-y-auto bg-white p-6',
              mode === 'split' ? 'hidden lg:block lg:w-1/2' : 'w-full',
            ].join(' ')}
          >
            <MarkdownPreview content={value} empty="开始输入内容，预览会实时显示在这里。" />
          </div>
        )}

        {dragActive && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-xl border-2 border-dashed border-brand-400 bg-brand-50/80">
            <div className="text-center text-brand-700">
              <ImageIcon className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm font-medium">松开鼠标插入图片</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-brand-700 shadow-card">
              <Upload className="h-4 w-4 animate-bounce" />
              正在上传图片…
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
        <span>
          {stats.chars.toLocaleString('zh-CN')} 字 · 约 {stats.minutes} 分钟阅读
        </span>
        <span className="hidden sm:inline">支持拖拽 / 粘贴图片 · ⌘S 保存</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => uploadFiles(event.target.files)}
      />

      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={insertFromPicker}
      />
    </div>
  )
}

const ModeButton = ({ active, title, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`rounded-md p-1.5 transition-colors ${
      active ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    {children}
  </button>
)

export default MarkdownEditor
