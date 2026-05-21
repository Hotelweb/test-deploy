import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginationQueryDto,
  type PaginatedResponse,
} from '../../common/pagination/pagination.dto.js';
import { CreateFoodOrderDto } from '../dto/create-food-order.dto.js';
import { UpdateFoodOrderStatusDto } from '../dto/update-food-order-status.dto.js';
import {
  FoodOrder,
  FoodOrderItem,
  type FoodOrderStatus,
} from '../entities/food-order.entity.js';
import { MenuItem } from '../entities/menu-item.entity.js';
import { toOrderView } from '../helpers/food-order-mappers.js';
import type { FoodOrderView } from '../types/food-order.types.js';

@Injectable()
export class OrderManagementService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuRepo: Repository<MenuItem>,
    @InjectRepository(FoodOrder)
    private readonly orderRepo: Repository<FoodOrder>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(dto: CreateFoodOrderDto): Promise<FoodOrderView> {
    const menuIds = [...new Set(dto.items.map((i) => i.menu_item_id))];
    const menuItems = await this.menuRepo.find({
      where: {
        id: In(menuIds),
        hotel_id: dto.hotel_id,
        is_available: true,
        deleted_at: IsNull(),
      },
    });

    if (menuItems.length !== menuIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều món không còn khả dụng. Vui lòng tải lại menu.',
      );
    }

    const menuById = new Map(menuItems.map((m) => [Number(m.id), m]));
    let total = 0;
    const lineEntities: Partial<FoodOrderItem>[] = [];

    for (const line of dto.items) {
      const menu = menuById.get(line.menu_item_id);
      if (!menu) {
        throw new BadRequestException(`Món #${line.menu_item_id} không hợp lệ`);
      }
      const unitPrice = Number(menu.price);
      total += unitPrice * line.quantity;
      lineEntities.push({
        menu_item_id: menu.id,
        item_name: menu.name,
        category: menu.category,
        unit_price: String(unitPrice),
        quantity: line.quantity,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(FoodOrder, {
        hotel_id: dto.hotel_id,
        service_id: dto.service_id ?? null,
        room_number: dto.room_number ?? null,
        customer_name: dto.customer_name ?? null,
        customer_phone: dto.customer_phone ?? null,
        note: dto.note ?? null,
        status: 'PENDING',
        total_amount: String(total),
      });
      const savedOrder = await manager.save(order);

      const items = lineEntities.map((line) =>
        manager.create(FoodOrderItem, {
          ...line,
          order_id: savedOrder.id,
        }),
      );
      savedOrder.items = await manager.save(items);

      return toOrderView(savedOrder);
    });
  }

  async getOrdersForAdmin(
    hotelId: number,
    pagination: PaginationQueryDto,
    status?: FoodOrderStatus,
  ): Promise<PaginatedResponse<FoodOrderView>> {
    const where: Record<string, unknown> = { hotel_id: hotelId };
    if (status) where.status = status;

    const [orders, totalCount] = await this.orderRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      relations: ['items'],
      skip: (pagination.page - 1) * pagination.per_page,
      take: pagination.per_page,
    });

    return buildPaginatedResponse(
      orders.map((order) => toOrderView(order)),
      totalCount,
      pagination,
      `/food-order/admin/orders/hotel/${hotelId}`,
      { status },
    );
  }

  async getOrder(id: number): Promise<FoodOrderView> {
    const order = await this.findOrder(id);
    return toOrderView(order);
  }

  async updateOrderStatus(
    id: number,
    dto: UpdateFoodOrderStatusDto,
  ): Promise<FoodOrderView> {
    const order = await this.findOrder(id);

    if (dto.status === 'REJECTED' && !dto.rejected_reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối đơn hàng');
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Đơn hàng đã kết thúc, không thể thay đổi');
    }

    order.status = dto.status;
    if (dto.status === 'REJECTED') {
      order.rejected_reason = dto.rejected_reason?.trim() ?? null;
    } else if (dto.status === 'ACCEPTED') {
      order.rejected_reason = null;
    }

    const saved = await this.orderRepo.save(order);
    return toOrderView(saved);
  }

  async countPending(hotelId: number): Promise<number> {
    return this.orderRepo.count({
      where: { hotel_id: hotelId, status: 'PENDING' },
    });
  }

  private async findOrder(id: number): Promise<FoodOrder> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }
}
