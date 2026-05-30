import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteMenuItem,
  assignFoodOrder,
  getAdminFoodOrders,
  getAdminMenu,
  getFoodOrderAnalytics,
  getFoodOrderStats,
  getHotel,
  getPendingOrderCount,
  updateFoodOrderStatus,
  type FoodOrder,
  type FoodOrderAnalytics,
  type FoodOrderStats,
  type FoodOrderStatus,
  type Hotel,
  type MenuItem,
  type PaginatedResponse,
} from '../../../../api'
import { useAuth } from '../../../../hooks/useAuth'
import { playNotificationSound } from '../../../../lib/notifications'
import { useChatSocket } from '../../../../hooks/useChatSocket'
import type { OrderFilter, Tab } from '../consts'

export type MenuModalState = { mode: 'create' } | { mode: 'edit'; item: MenuItem } | null

const ORDERS_PER_PAGE = 20

export function useFoodOrderAdmin(hotelId: number, enabled = true) {
  const auth = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [tab, setTab] = useState<Tab>('orders')
  const [stats, setStats] = useState<FoodOrderStats | null>(null)
  const [analytics, setAnalytics] = useState<FoodOrderAnalytics | null>(null)
  const [orders, setOrders] = useState<FoodOrder[]>([])
  const [ordersMeta, setOrdersMeta] = useState<PaginatedResponse<FoodOrder>['meta'] | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [orderPage, setOrderPage] = useState(1)
  const [menuModal, setMenuModal] = useState<MenuModalState>(null)

  const orderCounts = useMemo(
    () => ({
      all: stats?.total_orders ?? 0,
      new: stats?.pending_orders ?? 0,
      accepted: stats?.accepted_orders ?? 0,
      preparing: stats?.preparing_orders ?? 0,
      delivering: stats?.delivering_orders ?? 0,
      completed: stats?.completed_orders ?? 0,
      rejected: stats?.rejected_orders ?? 0,
      cancelled: stats?.cancelled_orders ?? 0,
    }),
    [stats],
  )

  const loadOrders = useCallback(
    async (page = orderPage, filter = orderFilter) => {
      if (!hotelId || !enabled) return
      setLoadingOrders(true)
      try {
        const status = filter === 'all' ? undefined : filter
        const response = await getAdminFoodOrders(hotelId, status, page, ORDERS_PER_PAGE)
        setOrders(response.data)
        setOrdersMeta(response.meta)
      } finally {
        setLoadingOrders(false)
      }
    },
    [enabled, hotelId, orderFilter, orderPage],
  )

  const loadAll = useCallback(async () => {
    if (!hotelId || !enabled) {
      setLoading(false)
      return
    }
    try {
      const [h, s, a, m, p] = await Promise.all([
        getHotel(hotelId),
        getFoodOrderStats(hotelId),
        getFoodOrderAnalytics(hotelId),
        getAdminMenu(hotelId),
        getPendingOrderCount(hotelId),
      ])
      setHotel(h)
      setStats(s)
      setAnalytics(a)
      setMenu(m)
      setPendingCount(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [enabled, hotelId])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadAll()
    })
    return () => {
      cancelled = true
    }
  }, [loadAll])

  useEffect(() => {
    if (!hotelId || !enabled) return
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const status = orderFilter === 'all' ? undefined : orderFilter
          const [o, p, s, a] = await Promise.all([
            getAdminFoodOrders(hotelId, status, orderPage, ORDERS_PER_PAGE),
            getPendingOrderCount(hotelId),
            getFoodOrderStats(hotelId),
            getFoodOrderAnalytics(hotelId),
          ])
          setPendingCount((prev) => {
            if (p > prev && prev > 0) playNotificationSound()
            return p
          })
          setOrders(o.data)
          setOrdersMeta(o.meta)
          setStats(s)
          setAnalytics(a)
        } catch {
          // ignore poll errors
        }
      })()
    }, 15000)
    return () => {
      window.clearInterval(id)
    }
  }, [enabled, hotelId, orderFilter, orderPage])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadOrders()
    })
    return () => {
      cancelled = true
    }
  }, [loadOrders])

  const handleOrderAction = async (order: FoodOrder, status: FoodOrderStatus) => {
    let rejected_reason: string | undefined
    if (status === 'rejected') {
      const reason = window.prompt('Lý do từ chối đơn hàng:')
      if (!reason?.trim()) return
      rejected_reason = reason.trim()
    }
    try {
      const updated = await updateFoodOrderStatus(order.id, { status, rejected_reason })
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      const [s, a, p] = await Promise.all([
        getFoodOrderStats(hotelId),
        getFoodOrderAnalytics(hotelId),
        getPendingOrderCount(hotelId),
      ])
      setStats(s)
      setAnalytics(a)
      setPendingCount(p)
      void loadOrders()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không cập nhật được')
    }
  }

  const handleAssignOrderToMe = async (order: FoodOrder) => {
    if (!auth?.user.id) return
    try {
      const updated = await assignFoodOrder(order.id, { assigned_to_user_id: auth.user.id })
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không gán được đơn hàng')
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

  const handleOrderFilterChange = (filter: OrderFilter) => {
    setOrderFilter(filter)
    setOrderPage(1)
  }

  useChatSocket({
    hotelId: enabled ? hotelId : null,
    role: 'staff',
    onOrderCreated: ({ order }) => {
      playNotificationSound()
      if (orderFilter === 'all' || order.status === orderFilter) {
        setOrders((prev) => [order, ...prev.filter((item) => item.id !== order.id)])
      }
      setPendingCount((count) => count + (order.status === 'new' ? 1 : 0))
      void Promise.all([
        getFoodOrderStats(hotelId).then(setStats),
        getFoodOrderAnalytics(hotelId).then(setAnalytics),
      ])
    },
    onOrderStatusChanged: ({ order }) => {
      setOrders((prev) => prev.map((item) => (item.id === order.id ? order : item)))
      void Promise.all([
        getFoodOrderStats(hotelId).then(setStats),
        getFoodOrderAnalytics(hotelId).then(setAnalytics),
        getPendingOrderCount(hotelId).then(setPendingCount),
      ])
    },
  })

  return {
    hotel,
    tab,
    setTab,
    stats,
    analytics,
    menu,
    pendingCount,
    loading,
    loadingOrders,
    orderFilter,
    setOrderFilter: handleOrderFilterChange,
    orderPage,
    setOrderPage,
    ordersMeta,
    menuModal,
    setMenuModal,
    orderCounts,
    orders,
    handleOrderAction,
    handleAssignOrderToMe,
    handleDeleteMenu,
    handleMenuSaved,
  }
}
