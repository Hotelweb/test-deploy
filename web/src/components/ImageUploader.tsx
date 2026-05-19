import { useId, useRef, useState } from 'react'
import { uploadImage, type UploadFolder } from '../api'
import { CloseIcon, ImagePlaceholderIcon } from './icons/ServiceIcons'

interface ImageUploaderProps {
  /** Current Cloudinary URL (or null when nothing is uploaded yet). */
  value: string | null | undefined
  onChange: (next: string | null) => void
  /** Cloudinary sub-folder so the dashboard groups uploads by feature. */
  folder?: UploadFolder
  /**
   * Aspect ratio for the preview tile. Matches common admin needs:
   *   - `square`  : avatars / icons
   *   - `wide`    : banners (16:9)
   *   - `portrait`: hero / cover
   */
  aspect?: 'square' | 'wide' | 'portrait'
  /** Label shown to screen readers when the picker is empty. */
  ariaLabel?: string
  /** Inline help shown below the dropzone. */
  hint?: string
  className?: string
}

const ASPECT: Record<NonNullable<ImageUploaderProps['aspect']>, string> = {
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
  portrait: 'aspect-[3/4]',
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB — matches the backend limit

/**
 * Drag-and-drop / click-to-select image uploader.
 *
 * The component talks to the backend `/uploads/image` endpoint which proxies
 * to Cloudinary, so the secret API credentials never reach the browser. The
 * resolved `secure_url` is written back via `onChange`.
 *
 * Validation up-front keeps obvious mistakes off the wire:
 *   - Type: must be a browser-native image MIME
 *   - Size: ≤ 5 MB
 */
export function ImageUploader({
  value,
  onChange,
  folder = 'misc',
  aspect = 'wide',
  ariaLabel = 'Tải ảnh lên',
  hint,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validate = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Chỉ chấp nhận tệp ảnh'
    if (file.size > MAX_BYTES) return 'Ảnh vượt quá 5 MB'
    return null
  }

  const pushFile = async (file: File) => {
    const v = validate(file)
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setUploading(true)
    setProgress(20)
    try {
      // Tiny fake progress so the dropzone doesn't look frozen — fetch()
      // doesn't expose upload progress without XHR or streams. Cloudinary
      // is fast enough that this is mostly cosmetic.
      const ramp = window.setInterval(() => {
        setProgress((p) => (p === null ? 20 : Math.min(p + 8, 85)))
      }, 150)
      try {
        const result = await uploadImage(file, folder)
        onChange(result.url)
      } finally {
        window.clearInterval(ramp)
      }
      setProgress(100)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tải ảnh thất bại'
      setError(message)
    } finally {
      setUploading(false)
      window.setTimeout(() => setProgress(null), 400)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    void pushFile(file)
    // Reset so picking the same file twice still triggers onChange.
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void pushFile(file)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setError(null)
  }

  const showImage = value && !uploading

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative ${ASPECT[aspect]} w-full rounded-xl overflow-hidden border-2 border-dashed transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          showImage
            ? 'border-transparent bg-gray-100'
            : isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-gray-50 hover:border-primary/40 hover:bg-emerald-50/30'
        } ${uploading ? 'cursor-progress' : ''}`}
      >
        <input
          ref={inputRef}
          id={`uploader-${id}`}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {showImage ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xoá ảnh"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 bg-gradient-to-t from-black/50 to-transparent text-white text-[11.5px] font-medium opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              Bấm để thay ảnh
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-1.5 text-text-muted">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[12px] font-medium text-text">Đang tải lên…</p>
                {progress !== null ? (
                  <div className="w-32 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <ImagePlaceholderIcon className="w-5 h-5" />
                </span>
                <p className="text-[12.5px] font-semibold text-text">Bấm hoặc kéo ảnh vào đây</p>
                <p className="text-[11px] text-text-light leading-snug">
                  PNG, JPG, WebP, GIF, SVG · tối đa 5 MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-[12px] text-red-600 font-medium">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[11.5px] text-text-light">{hint}</p>
      ) : null}
    </div>
  )
}
