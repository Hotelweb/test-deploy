import { useState } from 'react'
import type { ChatSession, ChatSessionStatus } from '../../api'
import { updateSessionStatus } from '../../api'
import { getLanguage } from '../../lib/languages'
import { CalendarIcon, TagIcon, UserCircleIcon } from '../icons/ServiceIcons'

interface GuestInfoPanelProps {
  session: ChatSession
  onStatusChange?: (status: ChatSessionStatus) => void
}

const STATUS_OPTIONS: { value: ChatSessionStatus; label: string; tone: string }[] = [
  { value: 'OPEN', label: 'Đang chờ', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'ASSIGNED', label: 'Đang xử lý', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'BOOKED', label: 'Đã đặt', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'CLOSED', label: 'Đã đóng', tone: 'bg-gray-100 text-gray-600 border-gray-200' },
]

export function GuestInfoPanel({ session, onStatusChange }: GuestInfoPanelProps) {
  const lang = getLanguage(session.customer_language)
  // Optimistic override + the session id it belongs to. When the upstream
  // session id or status changes, the override is implicitly invalidated by
  // comparing keys — this avoids a setState-in-effect cycle.
  const [override, setOverride] = useState<{
    sessionId: number
    sourceStatus: ChatSessionStatus
    target: ChatSessionStatus
  } | null>(null)

  const overrideValid =
    override !== null &&
    override.sessionId === session.id &&
    override.sourceStatus === session.status

  const status: ChatSessionStatus = overrideValid ? override!.target : session.status

  const handleStatusChange = async (next: ChatSessionStatus) => {
    if (next === status) return
    setOverride({ sessionId: session.id, sourceStatus: session.status, target: next })
    try {
      await updateSessionStatus(session.id, next)
      onStatusChange?.(next)
    } catch (err) {
      console.error('Failed to update status:', err)
      setOverride(null)
    }
  }

  const guestName = session.customer_name || `Khách #${session.id}`
  const initial = guestName.charAt(0).toUpperCase()

  return (
    <aside className="w-[300px] border-l border-border-light bg-white flex-shrink-0 overflow-y-auto hidden xl:block">
      <div className="p-5 text-center border-b border-border-light">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
          {initial}
        </div>
        <p className="font-bold text-text text-[15px] truncate">{guestName}</p>
        {session.customer_country ? (
          <p className="text-[12px] text-text-light mt-0.5">{session.customer_country}</p>
        ) : null}
        <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-50 border border-border-light rounded-full px-2.5 py-1 text-[11.5px] text-text-muted">
          <span aria-hidden>{lang.flag}</span>
          <span>{lang.nativeName}</span>
        </div>
      </div>

      {/* Status switcher */}
      <div className="p-5 border-b border-border-light">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-lighter mb-2.5">
          Trạng thái
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              disabled={overrideValid && opt.value !== status}
              className={`px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
                status === opt.value
                  ? `${opt.tone} ring-2 ring-offset-1 ring-current/20`
                  : 'bg-white border-border-light text-text-muted hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Section title="Liên hệ">
        <Field
          icon={<UserCircleIcon className="w-4 h-4" />}
          label="Tên"
          value={session.customer_name}
        />
        <Field icon="📞" label="Điện thoại" value={session.customer_phone} />
        <Field icon="✉️" label="Email" value={session.customer_email} />
      </Section>

      {/* Booking */}
      <Section title="Thông tin đặt phòng">
        <Field
          icon={<CalendarIcon className="w-4 h-4" />}
          label="Nhận phòng"
          value={formatDate(session.check_in_date)}
        />
        <Field
          icon={<CalendarIcon className="w-4 h-4" />}
          label="Trả phòng"
          value={formatDate(session.check_out_date)}
        />
        <Field
          icon={<TagIcon className="w-4 h-4" />}
          label="Loại phòng"
          value={session.room_type}
        />
        <Field icon="👥" label="Số khách" value={session.guest_count?.toString()} />
        <Field icon="🚪" label="Số phòng" value={session.room_number} />
      </Section>

      {/* Initial request */}
      {session.initial_request ? (
        <Section title="Yêu cầu ban đầu">
          <p className="text-[13px] text-text leading-relaxed bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2.5">
            {session.initial_request}
          </p>
        </Section>
      ) : null}

      {/* Session meta */}
      <Section title="Phiên hội thoại">
        <Field
          icon="🕒"
          label="Tạo lúc"
          value={new Date(session.created_at).toLocaleString('vi-VN')}
        />
        <Field
          icon="💬"
          label="Tin gần nhất"
          value={
            session.last_message_at
              ? new Date(session.last_message_at).toLocaleString('vi-VN')
              : '—'
          }
        />
      </Section>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 border-b border-border-light">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-lighter mb-2.5">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-6 h-6 rounded-md bg-gray-50 text-text-muted text-[12px] flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-lighter font-medium">{label}</p>
        <p className="text-[13px] text-text font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

function formatDate(date: string | null | undefined): string | null {
  if (!date) return null
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return date
  }
}
