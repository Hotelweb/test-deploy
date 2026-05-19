import { useId, useState } from 'react'
import { MarkdownContent } from './MarkdownContent'

interface MarkdownEditorProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
  ariaLabel?: string
}

/**
 * Lightweight markdown editor with Edit / Preview tabs.
 *
 * We deliberately don't pull in a heavy editor like `@uiw/react-md-editor`
 * here — admins write short hotel-service blurbs (a few paragraphs, lists,
 * the occasional link). A textarea + a small toolbar of common shortcuts
 * keeps bundle size down while still feeling capable.
 *
 * Toolbar buttons wrap or insert at the caret position so admins can apply
 * formatting without leaving the keyboard.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
  ariaLabel,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const id = useId()
  const textareaId = `md-${id}`

  const wrapSelection = (before: string, after: string = before) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null
    if (!el) {
      onChange(`${value}${before}${after}`)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(next)
    // Restore the cursor inside the wrapper so the admin can keep typing.
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length + selected.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  const insertAtLineStart = (prefix: string) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null
    if (!el) {
      onChange(`${prefix}${value}`)
      return
    }
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', Math.max(start - 1, 0)) + 1
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + prefix.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="border border-border-light rounded-xl overflow-hidden bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {/* Tab + toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border-light bg-gray-50 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <TabButton active={tab === 'edit'} onClick={() => setTab('edit')} label="Soạn thảo" />
          <TabButton
            active={tab === 'preview'}
            onClick={() => setTab('preview')}
            label="Xem trước"
          />
        </div>
        {tab === 'edit' ? (
          <div className="flex items-center gap-0.5 flex-wrap">
            <ToolbarButton
              title="Đậm"
              onClick={() => wrapSelection('**')}
              label={<span className="font-bold">B</span>}
            />
            <ToolbarButton
              title="Nghiêng"
              onClick={() => wrapSelection('*')}
              label={<span className="italic">I</span>}
            />
            <ToolbarSeparator />
            <ToolbarButton
              title="Tiêu đề"
              onClick={() => insertAtLineStart('## ')}
              label={<span className="font-semibold text-[12px]">H</span>}
            />
            <ToolbarButton
              title="Danh sách"
              onClick={() => insertAtLineStart('- ')}
              label={<span className="text-[14px]">•</span>}
            />
            <ToolbarButton
              title="Danh sách số"
              onClick={() => insertAtLineStart('1. ')}
              label={<span className="text-[11.5px] font-medium">1.</span>}
            />
            <ToolbarSeparator />
            <ToolbarButton
              title="Liên kết"
              onClick={() => wrapSelection('[', '](https://)')}
              label={
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                  <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              }
            />
            <ToolbarButton
              title="Mã"
              onClick={() => wrapSelection('`')}
              label={<span className="font-mono text-[11px]">{'<>'}</span>}
            />
          </div>
        ) : null}
      </div>

      {tab === 'edit' ? (
        <textarea
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={
            placeholder ??
            'Hỗ trợ Markdown: **đậm**, *nghiêng*, ## tiêu đề, - danh sách, [liên kết](https://...)'
          }
          aria-label={ariaLabel ?? 'Trình soạn thảo Markdown'}
          className="w-full px-3.5 py-3 text-[13.5px] font-mono leading-relaxed resize-y focus:outline-none placeholder:text-text-lighter min-h-[160px] bg-white"
          spellCheck={false}
        />
      ) : (
        <div className="px-4 py-3 min-h-[160px] max-h-[400px] overflow-y-auto bg-white">
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-text-lighter italic text-[13px]">
              Chưa có nội dung — chuyển về tab soạn thảo để bắt đầu viết
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
        active ? 'bg-white text-text shadow-soft' : 'text-text-light hover:text-text'
      }`}
    >
      {label}
    </button>
  )
}

function ToolbarButton({
  title,
  onClick,
  label,
}: {
  title: string
  onClick: () => void
  label: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-white hover:text-text cursor-pointer transition-colors"
    >
      {label}
    </button>
  )
}

function ToolbarSeparator() {
  return <span className="w-px h-4 bg-border mx-1" aria-hidden />
}
