export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50/50">
      <div className="text-center px-6 max-w-sm">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl gradient-indigo flex items-center justify-center shadow-elevated">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-text font-bold text-lg">Chọn một cuộc trò chuyện</p>
        <p className="text-text-light text-[13.5px] mt-1.5 leading-relaxed">
          Mọi tin nhắn từ khách sẽ được tự động dịch sang tiếng Việt. Bạn chỉ cần trả lời bằng tiếng
          Việt — chúng tôi sẽ dịch sang ngôn ngữ của khách.
        </p>
      </div>
    </div>
  )
}
