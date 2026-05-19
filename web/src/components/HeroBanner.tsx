interface HeroBannerProps {
  title?: string
  subtitle?: string
  imageUrl?: string | null
}

export function HeroBanner({
  title = 'Khách sạn 5 sao',
  subtitle = 'Trải nghiệm dịch vụ đẳng cấp quốc tế với sự chăm sóc tận tâm',
  imageUrl,
}: HeroBannerProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-elevated">
      {/* Background image when provided */}
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      {/* Gradient layer */}
      <div
        className={`relative ${
          imageUrl ? 'bg-black/30' : 'gradient-hero-rich'
        } px-6 sm:px-12 md:px-16 lg:px-20 py-14 md:py-20 min-h-[280px] md:min-h-[360px] flex flex-col justify-center`}
      >
        {/* Decorative blurred orbs */}
        <div
          className="absolute top-8 right-8 w-32 h-32 rounded-full bg-yellow-300/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-8 left-8 w-24 h-24 rounded-full bg-emerald-300/30 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl">
          <h2
            className="text-white font-bold tracking-tight leading-[1.05] text-3xl sm:text-4xl md:text-5xl lg:text-[56px]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h2>
          <p className="text-white/90 mt-4 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}
