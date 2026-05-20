import { useState } from 'react'
import { TemplateIcon } from '../icons/ServiceIcons'
import { DEFAULT_TEMPLATES, type CannedResponse } from './CannedTemplates'

interface CannedResponsesProps {
  templates?: CannedResponse[]
  onSelect: (text: string) => void
}

export function CannedResponses({ templates = DEFAULT_TEMPLATES, onSelect }: CannedResponsesProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 cursor-pointer flex-shrink-0 ${
          open ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-text-muted'
        }`}
        aria-label="Mẫu trả lời nhanh"
        aria-expanded={open}
      >
        <TemplateIcon className="w-5 h-5" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute bottom-full left-0 mb-2 w-[320px] max-h-[360px] overflow-y-auto bg-white rounded-2xl shadow-elevated border border-border-light z-20 animate-scale-in"
            role="listbox"
            aria-label="Canned response templates"
          >
            <div className="sticky top-0 bg-white border-b border-border-light px-4 py-2.5 z-10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-lighter">
                Mẫu trả lời nhanh
              </p>
            </div>
            <div className="p-2 grid gap-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => {
                    onSelect(tpl.text)
                    setOpen(false)
                  }}
                  className="text-left p-2.5 rounded-xl hover:bg-indigo-50 cursor-pointer transition-colors duration-150 group"
                >
                  <p className="text-[12.5px] font-semibold text-text group-hover:text-indigo-700">
                    {tpl.label}
                  </p>
                  <p className="text-[11.5px] text-text-light mt-0.5 line-clamp-2 leading-snug">
                    {tpl.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
