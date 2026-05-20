import type { FoodOrder, FoodOrderStatus } from '../../../../api'
import type { OrderFilter } from '../consts'

export function getOrderCounts(orders: FoodOrder[]): Record<OrderFilter, number> {
  return {
    all: orders.length,
    PENDING: countByStatus(orders, 'PENDING'),
    ACCEPTED: countByStatus(orders, 'ACCEPTED'),
    COMPLETED: countByStatus(orders, 'COMPLETED'),
    REJECTED: countByStatus(orders, 'REJECTED'),
    CANCELLED: countByStatus(orders, 'CANCELLED'),
  }
}

function countByStatus(orders: FoodOrder[], status: FoodOrderStatus) {
  return orders.filter((order) => order.status === status).length
}
