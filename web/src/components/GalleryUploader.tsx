import { useRef, useState } from 'react'
import { uploadImage, type UploadFolder } from '../api'
import { CloseIcon, ImagePlaceholderIcon, PlusIcon } from './icons/ServiceIcons'

interface GalleryUploaderProps {
  value: string[]
  onChange: (next: string[]) => void
  folder?: UploadFolder
  /** Maximum number of photos. Defaults to 12, plenty for an intro grid. */
  max?: number
  /** Optional helper text shown under the grid. */
  hint?: string
}

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'

/**
 * Multi-image uploader for a hotel's intro gallery.
 *
 * Each tile is a small Cloudinary-hosted thumbnail; admins can:
 *   - drag tiles to reorder (HTML5 drag API, no extra deps)
 *   - remove individual tiles
 *   - add new tiles via the "+" cell which supports multi-file selection
 *
 * Uploads run in parallel on selection; failed files surface an inline
 * error without blocking the others.
 */
export function GalleryUploader({
  value,
  onChange,
  folder = 'hotels',
  max = 12,
  hint,
}: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const remaining = Math.max(0, max - value.length)

  const pushFiles = async (files: FileList) => {
    const list = Array.from(files).slice(0, remaining)
    if (list.length === 0) {
      if (files.length > remaining) {
        setError(`Tối đa ${max} ảnh — vui lòng xoá bớt trước khi thêm`)
      }
      return
    }

    setError(null)
    const validFiles: File[] = []
    for (const file of list) {
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" không phải ảnh`)
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" vượt quá 5 MB`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setUploadingCount((c) => c + validFiles.length)

    const results = await Promise.allSettled(validFiles.map((file) => uploadImage(file, folder)))

    const newUrls: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') {
        newUrls.push(r.value.url)
      } else {
        const message = r.reason instanceof Error ? r.reason.message : 'Tải ảnh thất bại'
        setError(message)
      }
    }
    if (newUrls.length > 0) onChange([...value, ...newUrls])

    setUploadingCount((c) => Math.max(0, c - validFiles.length))
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) void pushFiles(files)
    e.target.value = ''
  }

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
  }

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) {
      return
    }
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            draggable
            onDragStart={(e) => {
              setDraggingIdx(idx)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (draggingIdx !== null) reorder(draggingIdx, idx)
              setDraggingIdx(null)
            }}
            onDragEnd={() => setDraggingIdx(null)}
            className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-grab active:cursor-grabbing transition-opacity ${
              draggingIdx === idx ? 'opacity-40' : ''
            }`}
          >
            <img
              src={url}
              alt={`Ảnh ${idx + 1}`}
              className="w-full h-full object-cover pointer-events-none"
            />
            <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10.5px] font-semibold rounded-md px-1.5 py-0.5 backdrop-blur">
              #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label="Xoá ảnh"
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Pending tiles — give visual feedback while parallel uploads run. */}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
          >
            <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ))}

        {/* Add tile — only shown when there's room. */}
        {value.length + uploadingCount < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1.5 text-text-muted cursor-pointer transition-all"
          >
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
              <PlusIcon className="w-4 h-4" />
            </span>
            <span className="text-[12px] font-medium text-text">Thêm ảnh</span>
            <span className="text-[10.5px] text-text-light">
              Còn {max - value.length - uploadingCount}
            </span>
          </button>
        ) : null}
      </div>

      {value.length === 0 && uploadingCount === 0 ? (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-text-light">
          <ImagePlaceholderIcon className="w-4 h-4 text-text-lighter" />
          <span>Kéo nhiều ảnh cùng lúc hoặc bấm để chọn</span>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-[12px] text-red-600 font-medium">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[11.5px] text-text-light">{hint}</p>
      ) : null}
    </div>
  )
}
