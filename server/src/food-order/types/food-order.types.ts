import type { FoodOrderStatus } from '../entities/food-order.entity.js';

export interface MenuItemView {
  id: number;
  hotel_id: number;
  category: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FoodOrderItemView {
  id: number;
  menu_item_id: number | null;
  item_name: string;
  category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface FoodOrderView {
  id: number;
  hotel_id: number;
  service_id: number | null;
  room_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  status: FoodOrderStatus;
  total_amount: number;
  rejected_reason: string | null;
  items: FoodOrderItemView[];
  created_at: Date;
  updated_at: Date;
}

export interface FoodOrderStats {
  total_orders: number;
  pending_orders: number;
  accepted_orders: number;
  rejected_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  revenue_today: number;
  orders_today: number;
}

export interface FoodOrderAnalyticsItem {
  item_name: string;
  category: string;
  quantity: number;
  order_count: number;
  total_revenue: number;
}

export interface FoodOrderAnalyticsHour {
  hour: number;
  order_count: number;
  total_revenue: number;
}

export interface FoodOrderAnalyticsStatus {
  status: FoodOrderStatus;
  order_count: number;
  total_revenue: number;
}

export interface FoodOrderAnalyticsCategory {
  category: string;
  quantity: number;
  total_revenue: number;
}

export interface FoodOrderAnalytics {
  top_items_by_quantity: FoodOrderAnalyticsItem[];
  top_items_by_revenue: FoodOrderAnalyticsItem[];
  orders_by_hour: FoodOrderAnalyticsHour[];
  status_breakdown: FoodOrderAnalyticsStatus[];
  category_breakdown: FoodOrderAnalyticsCategory[];
  peak_hour: FoodOrderAnalyticsHour | null;
}
