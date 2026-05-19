import { useEffect, useState } from 'react'
import { CloseIcon } from './icons/ServiceIcons'

interface HotelGalleryProps {
  /** Cloudinary URLs in display order — first is the hero tile. */
  images: string[]
  /** Section heading (Vietnamese / English). */
  heading: string
}

/**
 * Customer-facing intro gallery with a magazine-style mosaic and a click-to-
 * open lightbox.
 *
 * - 1 photo  → full-width hero
 * - 2 photos → side-by-side
 * - 3 photos → 1 large + 2 stacked
 * - 4+       → 1 large + a 2x2 grid, with a "+N" button on the last cell
 *              when there are more than 5 images
 *
 * The lightbox supports keyboard navigation (←/→/Esc) so guests can skim
 * through the photos quickly.
 */
export function HotelGallery({ images, heading }: HotelGalleryProps) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  // Lightbox keyboard handling
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images.length])

  if (images.length === 0) return null

  const openAt = (i: number) => {
    setIndex(i)
    setOpen(true)
  }

  return (
    <section aria-label={heading}>
      <h3 className="text-xl sm:text-2xl font-bold text-text tracking-tight mb-5">{heading}</h3>

      <Mosaic images={images} onOpen={openAt} />

      {open ? (
        <Lightbox
          images={images}
          index={index}
          onClose={() => setOpen(false)}
          onPrev={() => setIndex((i) => (i - 1 + images.length) % images.length)}
          onNext={() => setIndex((i) => (i + 1) % images.length)}
        />
      ) : null}
    </section>
  )
}

function Mosaic({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  if (images.length === 1) {
    return (
      <Tile src={images[0]} index={0} className="aspect-[16/9] w-full" onClick={() => onOpen(0)} />
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Tile src={images[0]} index={0} className="aspect-[4/3]" onClick={() => onOpen(0)} />
        <Tile src={images[1]} index={1} className="aspect-[4/3]" onClick={() => onOpen(1)} />
      </div>
    )
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Tile
          src={images[0]}
          index={0}
          className="aspect-[4/3] sm:aspect-square sm:col-span-2 sm:row-span-2"
          onClick={() => onOpen(0)}
        />
        <Tile
          src={images[1]}
          index={1}
          className="aspect-[4/3] sm:aspect-square"
          onClick={() => onOpen(1)}
        />
        <Tile
          src={images[2]}
          index={2}
          className="aspect-[4/3] sm:aspect-square"
          onClick={() => onOpen(2)}
        />
      </div>
    )
  }

  // 4+ photos: hero + 2×2 grid (max 5 visible, the 5th tile shows "+N")
  const visible = images.slice(0, 5)
  const overflow = Math.max(0, images.length - 5)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <Tile
        src={visible[0]}
        index={0}
        className="aspect-[4/3] sm:aspect-square col-span-2 sm:col-span-2 sm:row-span-2"
        onClick={() => onOpen(0)}
      />
      {visible.slice(1).map((src, i) => {
        const realIdx = i + 1
        const isLast = realIdx === visible.length - 1 && overflow > 0
        return (
          <Tile
            key={src + realIdx}
            src={src}
            index={realIdx}
            className="aspect-square"
            badge={isLast ? `+${overflow}` : undefined}
            onClick={() => onOpen(realIdx)}
          />
        )
      })}
    </div>
  )
}

function Tile({
  src,
  index,
  className,
  badge,
  onClick,
}: {
  src: string
  index: number
  className?: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Mở ảnh ${index + 1}`}
      className={`relative overflow-hidden rounded-2xl bg-gray-100 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className ?? ''}`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {badge ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xl sm:text-2xl font-bold backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phòng ảnh"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer backdrop-blur transition-colors z-10"
        aria-label="Đóng"
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      {images.length > 1 ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer backdrop-blur transition-colors z-10"
            aria-label="Ảnh trước"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer backdrop-blur transition-colors z-10"
            aria-label="Ảnh tiếp"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      ) : null}

      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-modal animate-scale-in"
      />

      {images.length > 1 ? (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/15 text-white text-[12.5px] font-medium backdrop-blur">
          {index + 1} / {images.length}
        </span>
      ) : null}
    </div>
  )
}
