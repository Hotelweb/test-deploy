import { useNavigate, useParams } from 'react-router-dom'
import { AdminChatConversation } from './AdminChatConversation'
import { AdminChatSidebar } from './AdminChatSidebar'
import { EmptyState } from './EmptyState'
import { useAdminChat } from './useAdminChat'

export function AdminChatPage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()

  const chat = useAdminChat(hotelId)

  if (chat.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-warm">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Đang tải bảng điều khiển…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex bg-background-warm overflow-hidden">
      <AdminChatSidebar
        hotel={chat.hotel}
        search={chat.search}
        onSearchChange={chat.setSearch}
        filter={chat.filter}
        onFilterChange={chat.setFilter}
        filterCounts={chat.filterCounts}
        filteredSessions={chat.filteredSessions}
        activeSessionId={chat.activeSession?.id}
        onSelectSession={chat.handleSelectSession}
        soundEnabled={chat.soundEnabled}
        onSoundToggle={() => chat.setSoundEnabled((v) => !v)}
        notifEnabled={chat.notifEnabled}
        onToggleNotifications={chat.toggleNotifications}
        onBack={() => navigate(`/admin/${hotelId}`)}
        hiddenOnMobile={Boolean(chat.activeSession)}
      />

      <main className={`flex-1 min-w-0 bg-white ${chat.activeSession ? 'flex' : 'hidden md:flex'}`}>
        {chat.activeSession ? (
          <AdminChatConversation
            session={chat.activeSession}
            connection={chat.connection}
            showOriginal={chat.showOriginal}
            onShowOriginalToggle={() => chat.setShowOriginal((v) => !v)}
            loadingMessages={chat.loadingMessages}
            messages={chat.messages}
            guestTyping={chat.guestTyping}
            messagesEndRef={chat.messagesEndRef}
            input={chat.input}
            onInputChange={chat.setInput}
            inputRef={chat.inputRef}
            fileInputRef={chat.fileInputRef}
            onSend={chat.handleSend}
            onKeyDown={chat.handleKeyDown}
            onAttachClick={chat.handleAttachClick}
            onFileChange={chat.handleFileChange}
            onRetry={chat.handleRetry}
            onBackToList={() => chat.setActiveSession(null)}
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
