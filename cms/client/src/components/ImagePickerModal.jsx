import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Folder, Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { assetsAPI } from '../services/api'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.avif']

const isImage = (item) =>
  item.type === 'file' && IMAGE_EXTENSIONS.includes(String(item.ext || '').toLowerCase())

const ImagePickerModal = ({ isOpen, onClose, onSelectImage }) => {
  const [items, setItems] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSearch('')
    loadAssets(currentPath)
  }, [isOpen, currentPath])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const loadAssets = async (path) => {
    setLoading(true)
    try {
      const response = path ? await assetsAPI.getFolder(path) : await assetsAPI.getAll()
      setItems(response.data)
    } catch (error) {
      console.error('Error loading assets:', error)
      toast.error('加载图片资源失败')
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbs = useMemo(
    () => ['全部', ...currentPath.split('/').filter(Boolean)],
    [currentPath]
  )

  const navigateToBreadcrumb = (index) => {
    if (index === 0) {
      setCurrentPath('')
      return
    }
    setCurrentPath(currentPath.split('/').filter(Boolean).slice(0, index).join('/'))
  }

  const visibleItems = items.filter((item) => {
    if (item.type === 'directory') return !search || item.name.toLowerCase().includes(search.toLowerCase())
    if (!isImage(item)) return false
    return !search || item.name.toLowerCase().includes(search.toLowerCase())
  })

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setUploading(true)
    const folder = currentPath || 'images'

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        await assetsAPI.upload(formData)
      }
      toast.success(`已上传 ${files.length} 个文件`)
      await loadAssets(currentPath)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('上传失败')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />

      <div className="card relative flex h-[82vh] w-full max-w-5xl animate-fadeIn flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">选择图片</h2>
            <p className="mt-0.5 text-xs text-slate-400">点击图片插入到文章光标位置</p>
          </div>
          <button type="button" className="btn-icon -mr-2" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
            {currentPath && (
              <button
                type="button"
                onClick={() => {
                  const parts = currentPath.split('/').filter(Boolean)
                  setCurrentPath(parts.slice(0, -1).join('/'))
                }}
                className="mr-1 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
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
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`max-w-[10rem] truncate rounded px-1.5 py-1 ${
                    index === breadcrumbs.length - 1
                      ? 'font-medium text-slate-900'
                      : 'text-slate-500 hover:bg-slate-200/70'
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索当前目录"
                className="input h-9 w-40 py-1.5 pl-8 text-xs sm:w-52"
              />
            </div>
            <label className="btn btn-primary btn-sm cursor-pointer">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? '上传中' : '上传'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {visibleItems.map((item) => (
                <div key={item.path || item.name}>
                  {item.type === 'directory' ? (
                    <button
                      type="button"
                      onClick={() => setCurrentPath(item.path || item.name)}
                      className="group flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/60"
                    >
                      <Folder className="h-9 w-9 text-brand-500" />
                      <span className="clamp-2 text-xs font-medium text-slate-600">{item.name}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectImage(item.path || item.name)}
                      className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-all hover:border-brand-400 hover:ring-4 hover:ring-brand-500/10"
                    >
                      <img
                        src={assetsAPI.preview(item.path || item.name)}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-900/70 to-transparent px-2 pb-1.5 pt-6 text-left text-[11px] text-white">
                        {item.name}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100">
                <ImageIcon className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                {search ? '没有匹配的图片' : '当前目录还没有图片'}
              </p>
              <p className="mt-1 text-xs text-slate-400">可以直接上传图片，或返回上级文件夹</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImagePickerModal
