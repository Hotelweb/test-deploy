import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FoodOrder,
  FoodOrderItem,
  type FoodOrderStatus,
} from '../entities/food-order.entity.js';
import { toAnalyticsItem } from '../helpers/food-order-mappers.js';
import type {
  FoodOrderAnalytics,
  FoodOrderAnalyticsHour,
  FoodOrderStats,
} from '../types/food-order.types.js';

@Injectable()
export class FoodOrderStatsService {
  constructor(
    @InjectRepository(FoodOrder)
    private readonly orderRepo: Repository<FoodOrder>,
    @InjectRepository(FoodOrderItem)
    private readonly orderItemRepo: Repository<FoodOrderItem>,
  ) {}

  async getStats(hotelId: number): Promise<FoodOrderStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(*)', 'total_orders')
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'PENDING')`, 'pending')
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'ACCEPTED')`, 'accepted')
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'REJECTED')`, 'rejected')
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'COMPLETED')`, 'completed')
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'CANCELLED')`, 'cancelled')
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('ACCEPTED', 'COMPLETED')), 0)`,
        'total_revenue',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE o.created_at >= :todayStart)`,
        'orders_today',
      )
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('ACCEPTED', 'COMPLETED') AND o.created_at >= :todayStart), 0)`,
        'revenue_today',
      )
      .where('o.hotel_id = :hotelId', { hotelId, todayStart })
      .getRawOne<{
        total_orders: string;
        pending: string;
        accepted: string;
        rejected: string;
        completed: string;
        cancelled: string;
        total_revenue: string;
        orders_today: string;
        revenue_today: string;
      }>();

    return {
      total_orders: Number(stats?.total_orders ?? 0),
      pending_orders: Number(stats?.pending ?? 0),
      accepted_orders: Number(stats?.accepted ?? 0),
      rejected_orders: Number(stats?.rejected ?? 0),
      completed_orders: Number(stats?.completed ?? 0),
      cancelled_orders: Number(stats?.cancelled ?? 0),
      total_revenue: Number(stats?.total_revenue ?? 0),
      revenue_today: Number(stats?.revenue_today ?? 0),
      orders_today: Number(stats?.orders_today ?? 0),
    };
  }

  async getAnalytics(hotelId: number): Promise<FoodOrderAnalytics> {
    const servedStatuses: FoodOrderStatus[] = ['ACCEPTED', 'COMPLETED'];
    const activeStatuses: FoodOrderStatus[] = [
      'PENDING',
      'ACCEPTED',
      'COMPLETED',
    ];

    const topQuantityRows = await this.orderItemRepo
      .createQueryBuilder('i')
      .innerJoin(FoodOrder, 'o', 'o.id = i.order_id')
      .select('i.item_name', 'item_name')
      .addSelect('i.category', 'category')
      .addSelect('SUM(i.quantity)', 'quantity')
      .addSelect('COUNT(DISTINCT o.id)', 'order_count')
      .addSelect('SUM(i.quantity * i.unit_price)', 'total_revenue')
      .where('o.hotel_id = :hotelId', { hotelId })
      .andWhere('o.status IN (:...statuses)', { statuses: activeStatuses })
      .groupBy('i.item_name')
      .addGroupBy('i.category')
      .orderBy('SUM(i.quantity)', 'DESC')
      .addOrderBy('SUM(i.quantity * i.unit_price)', 'DESC')
      .limit(8)
      .getRawMany<{
        item_name: string;
        category: string;
        quantity: string;
        order_count: string;
        total_revenue: string;
      }>();

    const topRevenueRows = await this.orderItemRepo
      .createQueryBuilder('i')
      .innerJoin(FoodOrder, 'o', 'o.id = i.order_id')
      .select('i.item_name', 'item_name')
      .addSelect('i.category', 'category')
      .addSelect('SUM(i.quantity)', 'quantity')
      .addSelect('COUNT(DISTINCT o.id)', 'order_count')
      .addSelect('SUM(i.quantity * i.unit_price)', 'total_revenue')
      .where('o.hotel_id = :hotelId', { hotelId })
      .andWhere('o.status IN (:...statuses)', { statuses: servedStatuses })
      .groupBy('i.item_name')
      .addGroupBy('i.category')
      .orderBy('SUM(i.quantity * i.unit_price)', 'DESC')
      .addOrderBy('SUM(i.quantity)', 'DESC')
      .limit(8)
      .getRawMany<{
        item_name: string;
        category: string;
        quantity: string;
        order_count: string;
        total_revenue: string;
      }>();

    const hourlyRows = await this.orderRepo
      .createQueryBuilder('o')
      .select(
        `EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
        'hour',
      )
      .addSelect('COUNT(*)', 'order_count')
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('ACCEPTED', 'COMPLETED')), 0)`,
        'total_revenue',
      )
      .where('o.hotel_id = :hotelId', { hotelId })
      .groupBy(
        `EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
      )
      .orderBy('hour', 'ASC')
      .getRawMany<{
        hour: string;
        order_count: string;
        total_revenue: string;
      }>();

    const statusRows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'order_count')
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('ACCEPTED', 'COMPLETED')), 0)`,
        'total_revenue',
      )
      .where('o.hotel_id = :hotelId', { hotelId })
      .groupBy('o.status')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{
        status: FoodOrderStatus;
        order_count: string;
        total_revenue: string;
      }>();

    const categoryRows = await this.orderItemRepo
      .createQueryBuilder('i')
      .innerJoin(FoodOrder, 'o', 'o.id = i.order_id')
      .select('i.category', 'category')
      .addSelect('SUM(i.quantity)', 'quantity')
      .addSelect('SUM(i.quantity * i.unit_price)', 'total_revenue')
      .where('o.hotel_id = :hotelId', { hotelId })
      .andWhere('o.status IN (:...statuses)', { statuses: activeStatuses })
      .groupBy('i.category')
      .orderBy('SUM(i.quantity)', 'DESC')
      .getRawMany<{
        category: string;
        quantity: string;
        total_revenue: string;
      }>();

    const ordersByHour = Array.from({ length: 24 }, (_, hour) => {
      const row = hourlyRows.find((item) => Number(item.hour) === hour);
      return {
        hour,
        order_count: Number(row?.order_count ?? 0),
        total_revenue: Number(row?.total_revenue ?? 0),
      };
    });

    return {
      top_items_by_quantity: topQuantityRows.map((row) => toAnalyticsItem(row)),
      top_items_by_revenue: topRevenueRows.map((row) => toAnalyticsItem(row)),
      orders_by_hour: ordersByHour,
      status_breakdown: statusRows.map((row) => ({
        status: row.status,
        order_count: Number(row.order_count),
        total_revenue: Number(row.total_revenue),
      })),
      category_breakdown: categoryRows.map((row) => ({
        category: row.category,
        quantity: Number(row.quantity),
        total_revenue: Number(row.total_revenue),
      })),
      peak_hour: this.findPeakHour(ordersByHour),
    };
  }

  private findPeakHour(
    ordersByHour: FoodOrderAnalyticsHour[],
  ): FoodOrderAnalyticsHour | null {
    const peak = ordersByHour.reduce<FoodOrderAnalyticsHour | null>(
      (currentPeak, row) => {
        if (!currentPeak || row.order_count > currentPeak.order_count) {
          return row;
        }
        return currentPeak;
      },
      null,
    );

    return peak?.order_count ? peak : null;
  }
}
