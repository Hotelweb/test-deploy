import { useState } from 'react'
import type { ChatMessage } from '../../api'
import {
  AlertIcon,
  CheckDoubleIcon,
  CheckIcon,
  ClockIcon,
  TranslateBubbleIcon,
} from '../icons/ServiceIcons'

export type Viewer = 'customer' | 'staff'

export interface DisplayMessage extends ChatMessage {
  /** Local-only flag for optimistic updates. */
  _optimistic?: boolean
  /** Local-only flag for messages whose server send failed. */
  _failed?: boolean
}

interface MessageBubbleProps {
  message: DisplayMessage
  viewer: Viewer
  /**
   * If true, the bubble shows the translated text first and the original
   * text in a subtle secondary line. If false, only the appropriate language
   * for the viewer is shown.
   */
  showOriginal?: boolean
  /** Localized strings for status labels and CTA's. */
  labels: {
    sending: string
    sent: string
    delivered: string
    read: string
    failed: string
    retry: string
    showOriginal: string
    hideOriginal: string
    translating: string
    translationFailed: string
    translatedBadge: string
    you: string
    staff: string
  }
  onRetry?: (msg: DisplayMessage) => void
}

/**
 * Hospitality chat bubble that renders three layers depending on context:
 *   1. The text the viewer should READ (in their language).
 *   2. A subtle "original" line (one tap to expand) so they can verify.
 *   3. A status row: time + send/seen indicators + translation badge.
 *
 * - Customer viewer: prefers `original_message` (their own language).
 * - Staff viewer:    prefers Vietnamese — i.e. translated for guest msgs,
 *                     original for staff msgs.
 */
export function MessageBubble({
  message,
  viewer,
  showOriginal = false,
  labels,
  onRetry,
}: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(showOriginal)

  const isMine = isMessageMine(message, viewer)
  const isSystem = message.message_type === 'SYSTEM'
  const isImage = message.message_type === 'IMAGE'

  if (isSystem) {
    return <SystemMessage message={message} />
  }

  // Pick the primary text to render based on the viewer.
  const primaryText = pickPrimaryText(message, viewer)
  const secondaryText = pickSecondaryText(message, viewer)
  const showSecondary = Boolean(secondaryText && primaryText !== secondaryText)
  const isTranslating = message.translation_status === 'PENDING' && !message._optimistic
  const isTranslationFailed = message.translation_status === 'FAILED'

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
      data-testid="message-bubble"
    >
      <div
        className={`flex flex-col max-w-[82%] sm:max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 shadow-soft ${
            isMine
              ? viewer === 'customer'
                ? 'gradient-primary text-white rounded-br-md'
                : 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-white border border-border-light text-text rounded-bl-md'
          } ${message._failed ? 'ring-1 ring-red-300' : ''}`}
        >
          {/* Image attachment */}
          {isImage && message.image_url ? (
            <a
              href={message.image_url}
              target="_blank"
              rel="noreferrer"
              className="block -mx-1.5 -mt-1.5 mb-1 rounded-xl overflow-hidden"
            >
              <img
                src={message.image_url}
                alt="Attachment"
                className="block w-full max-w-[260px] max-h-[260px] object-cover"
                loading="lazy"
              />
            </a>
          ) : null}

          {/* Primary text */}
          {primaryText ? (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {primaryText}
            </p>
          ) : null}

          {/* Translation status + secondary line */}
          {!isImage && (isTranslating || isTranslationFailed || showSecondary) ? (
            <div
              className={`mt-1.5 pt-1.5 border-t ${
                isMine ? 'border-white/20' : 'border-border-light'
              }`}
            >
              {isTranslating ? (
                <div
                  className={`flex items-center gap-1.5 text-[11px] ${
                    isMine ? 'text-white/75' : 'text-text-light'
                  }`}
                >
                  <span className="flex gap-0.5" aria-hidden>
                    <span
                      className={`w-1 h-1 rounded-full ${isMine ? 'bg-white/60' : 'bg-text-light'} animate-bounce`}
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className={`w-1 h-1 rounded-full ${isMine ? 'bg-white/60' : 'bg-text-light'} animate-bounce`}
                      style={{ animationDelay: '120ms' }}
                    />
                    <span
                      className={`w-1 h-1 rounded-full ${isMine ? 'bg-white/60' : 'bg-text-light'} animate-bounce`}
                      style={{ animationDelay: '240ms' }}
                    />
                  </span>
                  <span>{labels.translating}</span>
                </div>
              ) : isTranslationFailed ? (
                <div
                  className={`flex items-center gap-1.5 text-[11px] ${
                    isMine ? 'text-white/85' : 'text-amber-600'
                  }`}
                >
                  <AlertIcon className="w-3 h-3" />
                  <span>{labels.translationFailed}</span>
                </div>
              ) : showSecondary ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors duration-200 ${
                    isMine
                      ? 'text-white/70 hover:text-white/90'
                      : 'text-text-light hover:text-text-muted'
                  }`}
                >
                  <TranslateBubbleIcon className="w-3 h-3" />
                  <span>{expanded ? labels.hideOriginal : labels.showOriginal}</span>
                </button>
              ) : null}

              {/* Expanded secondary text */}
              {expanded && showSecondary && !isTranslating ? (
                <p
                  className={`mt-1 text-[12.5px] leading-relaxed whitespace-pre-wrap italic ${
                    isMine ? 'text-white/85' : 'text-text-muted'
                  }`}
                >
                  {secondaryText}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Meta row: time + status (mine only) + translated badge */}
        <div
          className={`flex items-center gap-2 mt-1 px-1 ${
            isMine ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span className="text-[10.5px] text-text-lighter">{formatTime(message.created_at)}</span>

          {message.translation_status === 'TRANSLATED' && !isImage ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-text-light bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
              <TranslateBubbleIcon className="w-2.5 h-2.5" />
              {labels.translatedBadge}
            </span>
          ) : null}

          {isMine ? (
            <MessageStatusBadge
              message={message}
              labels={labels}
              onRetry={() => onRetry?.(message)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MessageStatusBadge({
  message,
  labels,
  onRetry,
}: {
  message: DisplayMessage
  labels: MessageBubbleProps['labels']
  onRetry: () => void
}) {
  if (message._failed) {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-[10.5px] text-red-600 hover:text-red-700 cursor-pointer"
      >
        <AlertIcon className="w-3 h-3" />
        <span>{labels.retry}</span>
      </button>
    )
  }
  if (message._optimistic || message.status === 'SENDING') {
    return (
      <span
        className="flex items-center gap-1 text-[10.5px] text-text-lighter"
        aria-label={labels.sending}
      >
        <ClockIcon className="w-3 h-3" />
      </span>
    )
  }
  if (message.status === 'READ' || message.is_read) {
    return (
      <span
        className="flex items-center gap-0.5 text-[10.5px] text-emerald-600"
        aria-label={labels.read}
      >
        <CheckDoubleIcon className="w-3.5 h-3.5" />
      </span>
    )
  }
  if (message.status === 'DELIVERED') {
    return (
      <span
        className="flex items-center gap-0.5 text-[10.5px] text-text-lighter"
        aria-label={labels.delivered}
      >
        <CheckDoubleIcon className="w-3.5 h-3.5" />
      </span>
    )
  }
  return (
    <span
      className="flex items-center gap-0.5 text-[10.5px] text-text-lighter"
      aria-label={labels.sent}
    >
      <CheckIcon className="w-3.5 h-3.5" />
    </span>
  )
}

function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center my-2">
      <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 max-w-[85%] shadow-soft border border-border-light">
        <p className="text-[11.5px] text-text-muted text-center">{message.original_message}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMessageMine(message: ChatMessage, viewer: Viewer): boolean {
  if (viewer === 'customer') return message.sender_type === 'CUSTOMER'
  return message.sender_type === 'STAFF'
}

/**
 * The text rendered FIRST in a bubble.
 *
 * - Customer viewer:
 *    - their own message: original_message (what they typed)
 *    - staff message:     translated_message in their language (fallback to original)
 *
 * - Staff viewer:
 *    - customer message:  translated_message in Vietnamese (fallback to original)
 *    - their own message: original_message (what they typed in Vietnamese)
 */
function pickPrimaryText(message: ChatMessage, viewer: Viewer): string {
  if (viewer === 'customer') {
    if (message.sender_type === 'CUSTOMER') return message.original_message ?? ''
    return message.translated_message ?? message.original_message ?? ''
  }
  if (message.sender_type === 'STAFF') return message.original_message ?? ''
  return message.translated_message ?? message.original_message ?? ''
}

/**
 * The "show original" secondary text.
 */
function pickSecondaryText(message: ChatMessage, viewer: Viewer): string | null {
  if (message.translation_status === 'SKIPPED') return null
  if (viewer === 'customer') {
    if (message.sender_type === 'CUSTOMER') return null
    // For staff messages: secondary = the staff's Vietnamese original
    if (message.original_message && message.original_message !== pickPrimaryText(message, viewer)) {
      return message.original_message
    }
    return null
  }
  // Staff viewer:
  if (message.sender_type === 'STAFF') return null
  // For customer messages: secondary = the original guest text (untranslated)
  if (message.original_message && message.original_message !== pickPrimaryText(message, viewer)) {
    return message.original_message
  }
  return null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
