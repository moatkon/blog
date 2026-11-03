import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Copy,
  Edit3,
  Eye,
  File,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { assetsAPI } from '../services/api'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.avif']

const isImage = (item) => IMAGE_EXTENSIONS.includes(String(item.ext || '').toLowerCase())

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${parseFloat((bytes / 1024 ** index).toFixed(1))} ${units[index]}`
}

const Assets = () => {
  const [items, setItems] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef(null)

  const loadAssets = async (path = currentPath) => {
    setLoading(true)
    try {
      const response = path ? await assetsAPI.getFolder(path) : await assetsAPI.getAll()
      setItems(response.data)
    } catch (error) {
      console.error('Error loading assets:', error)
      toast.error('加载资源失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets(currentPath)
  }, [currentPath])

  useEffect(() => {
    setSearch('')
  }, [currentPath])

  const itemPath = (item) =>
    item.path || (currentPath ? `${currentPath}/${item.name}` : item.name)

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((item) => item.name.toLowerCase().includes(keyword))
  }, [items, search])

  const breadcrumbs = ['全部资源', ...currentPath.split('/').filter(Boolean)]

  const navigateBreadcrumb = (index) => {
    if (index === 0) {
      setCurrentPath('')
      return
    }
    setCurrentPath(currentPath.split('/').filter(Boolean).slice(0, index).join('/'))
  }

  const uploadFiles = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return

    setUploading(true)
    let successCount = 0

    for (const file of list) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', currentPath)
        await assetsAPI.upload(formData)
        successCount += 1
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`${file.name} 上传失败`)
      }
    }

    setUploading(false)
    if (successCount) toast.success(`已上传 ${successCount} 个文件`)
    await loadAssets(currentPath)
  }

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch {
      toast.error('复制失败')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await assetsAPI.delete(itemPath(deleteTarget))
      toast.success('已删除')
      setDeleteTarget(null)
      await loadAssets(currentPath)
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const executeRename = async () => {
    if (!renameTarget || !renameValue.trim()) return
    try {
      await assetsAPI.rename(itemPath(renameTarget), renameValue.trim())
      toast.success('重命名成功')
      setRenameTarget(null)
      setRenameValue('')
      await loadAssets(currentPath)
    } catch (error) {
      console.error('Error renaming asset:', error)
      toast.error(error.response?.data?.error || '重命名失败')
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await assetsAPI.createFolder({ name: newFolderName.trim(), parent: currentPath })
      toast.success('文件夹创建成功')
      setNewFolderOpen(false)
      setNewFolderName('')
      await loadAssets(currentPath)
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('创建文件夹失败')
    }
  }

  const openItem = (item) => {
    if (item.type === 'directory') {
      setCurrentPath(itemPath(item))
      return
    }
    if (isImage(item)) {
      setPreviewItem(item)
      return
    }
    window.open(assetsAPI.preview(itemPath(item)), '_blank', 'noopener')
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragActive(false)
        uploadFiles(event.dataTransfer.files)
      }}
    >
      <PageHeader title="资源" description="管理 public 目录下的图片与文件">
        <button type="button" className="btn btn-secondary btn-md" onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="h-4 w-4" />
          新建文件夹
        </button>
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4" />
          {uploading ? '上传中…' : '上传文件'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            uploadFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
          {currentPath && (
            <button
              type="button"
              className="mr-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => {
                const parts = currentPath.split('/').filter(Boolean)
                setCurrentPath(parts.slice(0, -1).join('/'))
              }}
              title="返回上级"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {breadcrumbs.map((part, index) => (
            <React.Fragment key={`${part}-${index}`}>
              {index > 0 && <span className="text-slate-300">/</span>}
              <button
                type="button"
                onClick={() => navigateBreadcrumb(index)}
                className={`max-w-[12rem] truncate rounded px-1.5 py-1 ${
                  index === breadcrumbs.length - 1
                    ? 'font-medium text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索当前目录"
            className="input pl-9"
          />
        </div>
      </div>

      <div
        className={`mb-5 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition-colors ${
          dragActive
            ? 'border-brand-400 bg-brand-50 text-brand-700'
            : 'border-slate-200 bg-white text-slate-400'
        }`}
      >
        <Upload className="h-4 w-4" />
        {uploading ? '正在上传文件…' : '拖拽文件到这里上传到当前目录'}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="card overflow-hidden">
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="space-y-2 p-3">
                <div className="skeleton h-3 w-2/3" />
                <div className="skeleton h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((item) => {
            const path = itemPath(item)
            return (
              <div key={path} className="card group overflow-hidden">
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
                >
                  {item.type === 'directory' ? (
                    <span className="flex h-full flex-col items-center justify-center gap-2 text-brand-500">
                      <Folder className="h-10 w-10" fill="currentColor" strokeWidth={1.2} />
                      <span className="text-[11px] text-slate-400">
                        {item.children ? `${item.children.length} 项` : '文件夹'}
                      </span>
                    </span>
                  ) : isImage(item) ? (
                    <img
                      src={assetsAPI.preview(path)}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
                      <File className="h-9 w-9" strokeWidth={1.5} />
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        {String(item.ext || '').replace('.', '') || 'FILE'}
                      </span>
                    </span>
                  )}

                  {item.type === 'file' && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center gap-1 bg-gradient-to-t from-slate-900/50 to-transparent px-2 pb-2 pt-6 group-hover:flex">
                      <span className="text-[11px] text-white/90">
                        <Eye className="mr-1 inline h-3 w-3" />
                        预览
                      </span>
                    </span>
                  )}
                </button>

                <div className="p-3">
                  <p className="clamp-1 text-xs font-medium text-slate-700" title={item.name}>
                    {item.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {item.type === 'directory' ? '文件夹' : formatFileSize(item.size)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {item.type === 'file' && isImage(item) && (
                        <button
                          type="button"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="复制 Markdown"
                          onClick={() => copyText(`![${item.name.replace(/\.[^.]+$/, '')}](/${path})`, '已复制 Markdown')}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {item.type === 'file' && (
                        <button
                          type="button"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="复制路径"
                          onClick={() => copyText(`/${path}`, '路径已复制')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="重命名"
                        onClick={() => {
                          setRenameTarget(item)
                          setRenameValue(item.name)
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="删除"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100">
            <Folder className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-700">
            {search ? '没有匹配的文件' : '当前目录为空'}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {search ? '换个关键词试试' : '拖拽文件到上方区域，或点击上传文件'}
          </p>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setPreviewItem(null)} />
          <div className="relative max-h-[90vh] max-w-5xl">
            <button
              type="button"
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1.5 text-slate-600 shadow hover:text-slate-900"
              onClick={() => setPreviewItem(null)}
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={assetsAPI.preview(itemPath(previewItem))}
              alt={previewItem.name}
              className="max-h-[85vh] rounded-xl object-contain"
            />
            <p className="mt-2 text-center text-xs text-white/80">{previewItem.name}</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'directory' ? '删除文件夹？' : '删除文件？'}
        message={`「${deleteTarget?.name || ''}」${
          deleteTarget?.type === 'directory' ? '及其中的全部内容' : ''
        }将从 public 目录中删除，此操作无法撤销。`}
        confirmLabel="删除"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {renameTarget && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setRenameTarget(null)} />
          <div className="card relative w-full max-w-md animate-fadeIn p-6">
            <h3 className="text-base font-semibold text-slate-900">
              重命名{renameTarget.type === 'directory' ? '文件夹' : '文件'}
            </h3>
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') executeRename()
                if (event.key === 'Escape') setRenameTarget(null)
              }}
              className="input mt-4"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => setRenameTarget(null)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                disabled={!renameValue.trim()}
                onClick={executeRename}
              >
                重命名
              </button>
            </div>
          </div>
        </div>
      )}

      {newFolderOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setNewFolderOpen(false)} />
          <div className="card relative w-full max-w-md animate-fadeIn p-6">
            <h3 className="text-base font-semibold text-slate-900">新建文件夹</h3>
            <p className="mt-1 text-xs text-slate-400">
              创建位置：/{currentPath || 'public'}
            </p>
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') createFolder()
                if (event.key === 'Escape') setNewFolderOpen(false)
              }}
              placeholder="文件夹名称"
              className="input mt-4"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => setNewFolderOpen(false)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                disabled={!newFolderName.trim()}
                onClick={createFolder}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assets
