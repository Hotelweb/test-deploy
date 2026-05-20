import type { MenuItem } from '../../../../api'
import { InRoomDiningIcon, PlusIcon } from '../../../../components/icons/ServiceIcons'
import { getMenuGroups } from '../functions/getMenuGroups'
import { MenuMetric } from './MenuMetric'
import { MenuSection } from './MenuSection'

interface MenuPanelProps {
  items: MenuItem[]
  onAdd: () => void
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export function MenuPanel({ items, onAdd, onEdit, onDelete }: MenuPanelProps) {
  const { foodItems, drinkItems, hiddenItems } = getMenuGroups(items)

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text">Thực đơn</h2>
            <p className="text-[12.5px] text-text-light mt-1">
              Quản lý món đang bán, giá hiển thị và ảnh minh hoạ cho khách đặt.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MenuMetric label="Tổng món" value={items.length} />
            <MenuMetric label="Đồ ăn" value={foodItems.length} />
            <MenuMetric label="Nước uống" value={drinkItems.length} />
            <MenuMetric label="Đang ẩn" value={hiddenItems} muted />
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white gradient-primary text-[13px] font-semibold cursor-pointer shadow-card hover:shadow-card-hover transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm món
            </button>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-primary flex items-center justify-center">
            <InRoomDiningIcon className="w-7 h-7" />
          </div>
          <p className="text-text font-semibold mt-4">Chưa có món trong thực đơn</p>
          <p className="text-text-light text-[13px] mt-1">
            Thêm món đồ ăn hoặc nước uống đầu tiên để khách có thể đặt.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-white gradient-primary text-[13px] font-semibold cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm món
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <MenuSection title="Đồ ăn" items={foodItems} onEdit={onEdit} onDelete={onDelete} />
          <MenuSection title="Nước uống" items={drinkItems} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}
