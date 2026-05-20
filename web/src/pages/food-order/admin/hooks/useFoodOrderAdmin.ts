import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteMenuItem,
  getAdminFoodOrders,
  getAdminMenu,
  getFoodOrderStats,
  getHotel,
  getPendingOrderCount,
  updateFoodOrderStatus,
  type FoodOrder,
  type FoodOrderStats,
  type FoodOrderStatus,
  type Hotel,
  type MenuItem,
} from '../../../../api'
import { playNotificationSound } from '../../../../lib/notifications'
import type { OrderFilter, Tab } from '../consts'
import { getFilteredOrders } from '../functions/getFilteredOrders'
import { getOrderCounts } from '../functions/getOrderCounts'

export type MenuModalState = { mode: 'create' } | { mode: 'edit'; item: MenuItem } | null

export function useFoodOrderAdmin(hotelId: number) {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [tab, setTab] = useState<Tab>('orders')
  const [stats, setStats] = useState<FoodOrderStats | null>(null)
  const [orders, setOrders] = useState<FoodOrder[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [menuModal, setMenuModal] = useState<MenuModalState>(null)

  const orderCounts = useMemo(() => getOrderCounts(orders), [orders])
  const filteredOrders = useMemo(
    () => getFilteredOrders(orders, orderFilter),
    [orders, orderFilter],
  )

  const loadAll = useCallback(async () => {
    if (!hotelId) return
    try {
      const [h, s, o, m, p] = await Promise.all([
        getHotel(hotelId),
        getFoodOrderStats(hotelId),
        getAdminFoodOrders(hotelId),
        getAdminMenu(hotelId),
        getPendingOrderCount(hotelId),
      ])
      setHotel(h)
      setStats(s)
      setOrders(o.data)
      setMenu(m)
      setPendingCount(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadAll()
    })
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const [o, p, s] = await Promise.all([
            getAdminFoodOrders(hotelId),
            getPendingOrderCount(hotelId),
            getFoodOrderStats(hotelId),
          ])
          setPendingCount((prev) => {
            if (p > prev && prev > 0) playNotificationSound()
            return p
          })
          setOrders(o.data)
          setStats(s)
        } catch {
          // ignore poll errors
        }
      })()
    }, 15000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [hotelId, loadAll])

  const handleOrderAction = async (order: FoodOrder, status: FoodOrderStatus) => {
    let rejected_reason: string | undefined
    if (status === 'REJECTED') {
      const reason = window.prompt('Lý do từ chối đơn hàng:')
      if (!reason?.trim()) return
      rejected_reason = reason.trim()
    }
    try {
      const updated = await updateFoodOrderStatus(order.id, { status, rejected_reason })
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      const [s, p] = await Promise.all([getFoodOrderStats(hotelId), getPendingOrderCount(hotelId)])
      setStats(s)
      setPendingCount(p)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không cập nhật được')
    }
  }

  const handleDeleteMenu = async (item: MenuItem) => {
    if (!window.confirm(`Xoá món "${item.name}"?`)) return
    try {
      await deleteMenuItem(item.id)
      setMenu((prev) => prev.filter((menuItem) => menuItem.id !== item.id))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không xoá được')
    }
  }

  const handleMenuSaved = (saved: MenuItem) => {
    setMenu((prev) => {
      const idx = prev.findIndex((item) => item.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    setMenuModal(null)
  }

  return {
    hotel,
    tab,
    setTab,
    stats,
    menu,
    pendingCount,
    loading,
    orderFilter,
    setOrderFilter,
    menuModal,
    setMenuModal,
    orderCounts,
    filteredOrders,
    handleOrderAction,
    handleDeleteMenu,
    handleMenuSaved,
  }
}
