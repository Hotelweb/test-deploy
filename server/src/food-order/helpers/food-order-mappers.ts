import { FoodOrder } from '../entities/food-order.entity.js';
import { MenuItem } from '../entities/menu-item.entity.js';
import type {
  FoodOrderAnalyticsItem,
  FoodOrderView,
  MenuItemView,
} from '../types/food-order.types.js';

export function toMenuView(item: MenuItem, lang?: string): MenuItemView {
  const useEn = lang === 'en' && item.name_en;
  return {
    id: Number(item.id),
    hotel_id: Number(item.hotel_id),
    category: item.category,
    name: useEn ? item.name_en! : item.name,
    name_en: item.name_en,
    description:
      lang === 'en' && item.description_en
        ? item.description_en
        : item.description,
    description_en: item.description_en,
    price: Number(item.price),
    image_url: item.image_url,
    sort_order: item.sort_order,
    is_available: item.is_available,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export function toOrderView(order: FoodOrder): FoodOrderView {
  const items = (order.items ?? []).map((line) => ({
    id: Number(line.id),
    menu_item_id: line.menu_item_id ? Number(line.menu_item_id) : null,
    item_name: line.item_name,
    category: line.category,
    unit_price: Number(line.unit_price),
    quantity: line.quantity,
    line_total: Number(line.unit_price) * line.quantity,
  }));

  return {
    id: Number(order.id),
    hotel_id: Number(order.hotel_id),
    service_id: order.service_id ? Number(order.service_id) : null,
    order_code: order.order_code,
    room_number: order.room_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    note: order.note,
    status: order.status,
    total_amount: Number(order.total_amount),
    rejected_reason: order.rejected_reason,
    items,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export function toAnalyticsItem(row: {
  item_name: string;
  category: string;
  quantity: string;
  order_count: string;
  total_revenue: string;
}): FoodOrderAnalyticsItem {
  return {
    item_name: row.item_name,
    category: row.category,
    quantity: Number(row.quantity),
    order_count: Number(row.order_count),
    total_revenue: Number(row.total_revenue),
  };
}
