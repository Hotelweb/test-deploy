import { useState } from 'react'
import { createMenuItem, updateMenuItem, type MenuCategory, type MenuItem } from '../../../../api'
import { ImageUploader } from '../../../../components/ImageUploader'

interface MenuItemModalProps {
  hotelId: number
  mode: 'create' | 'edit'
  item: MenuItem | null
  onClose: () => void
  onSaved: (item: MenuItem) => void
}

export function MenuItemModal({ hotelId, mode, item, onClose, onSaved }: MenuItemModalProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [nameEn, setNameEn] = useState(item?.name_en ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice] = useState(item?.price ?? 0)
  const [category, setCategory] = useState<MenuCategory>(item?.category ?? 'food')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        name_en: nameEn.trim() || undefined,
        description: description.trim() || undefined,
        price: Number(price),
        category,
        image_url: imageUrl || undefined,
        is_available: isAvailable,
        sort_order: sortOrder,
      }
      const saved =
        mode === 'edit' && item
          ? await updateMenuItem(item.id, payload)
          : await createMenuItem({ hotel_id: hotelId, ...payload })
      onSaved(saved)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Lỗi lưu món')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3"
      >
        <h2 className="font-bold text-lg text-text">
          {mode === 'create' ? 'Thêm món' : 'Sửa món'}
        </h2>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MenuCategory)}
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
        >
          <option value="food">Đồ ăn</option>
          <option value="drink">Nước uống</option>
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên món (Tiếng Việt) *"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
          required
        />
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Tên tiếng Anh"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px] resize-none"
        />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Giá (VNĐ)"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
          required
        />
        <ImageUploader
          value={imageUrl}
          onChange={(next) => setImageUrl(next ?? '')}
          folder="menu"
          ariaLabel="Ảnh món"
          hint="Ảnh món ăn / nước uống"
        />
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
          Hiển thị cho khách
        </label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          placeholder="Thứ tự"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
        />
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-[14px] cursor-pointer"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white gradient-primary font-semibold text-[14px] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
