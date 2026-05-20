import type { FoodOrder } from '../../../../api'
import type { OrderFilter } from '../consts'

export function getFilteredOrders(orders: FoodOrder[], filter: OrderFilter) {
  return filter === 'all' ? orders : orders.filter((order) => order.status === filter)
}
