import { TABS, type Tab } from '../consts'

interface TabsNavProps {
  activeTab: Tab
  pendingCount: number
  onChange: (tab: Tab) => void
}

export function TabsNav({ activeTab, pendingCount, onChange }: TabsNavProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer ${
            activeTab === key
              ? 'bg-primary text-white'
              : 'bg-white border border-border text-text-muted'
          }`}
        >
          {label}
          {key === 'orders' && pendingCount > 0 ? ` (${pendingCount})` : ''}
        </button>
      ))}
    </div>
  )
}
