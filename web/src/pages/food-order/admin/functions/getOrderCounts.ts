import type { FoodOrder, FoodOrderStatus } from '../../../../api'
import type { OrderFilter } from '../consts'

export function getOrderCounts(orders: FoodOrder[]): Record<OrderFilter, number> {
  return {
    all: orders.length,
    new: countByStatus(orders, 'new'),
    accepted: countByStatus(orders, 'accepted'),
    preparing: countByStatus(orders, 'preparing'),
    delivering: countByStatus(orders, 'delivering'),
    completed: countByStatus(orders, 'completed'),
    rejected: countByStatus(orders, 'rejected'),
    cancelled: countByStatus(orders, 'cancelled'),
  }
}

function countByStatus(orders: FoodOrder[], status: FoodOrderStatus) {
  return orders.filter((order) => order.status === status).length
}
