import { BadRequestException } from '@nestjs/common';
import { OrderManagementService } from './order-management.service';

describe('OrderManagementService', () => {
  type EntityLike = Record<string, unknown>;

  function createService(overrides?: {
    existingOrder?: unknown;
    orderStatus?: string;
  }) {
    const menuRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          hotel_id: 1,
          name: 'Pho',
          category: 'food',
          price: '50000',
        },
      ]),
    };
    const order = {
      id: 9,
      hotel_id: 1,
      status: overrides?.orderStatus ?? 'new',
      rejected_reason: null,
      items: [],
    };
    const orderRepo = {
      findOne: jest.fn().mockResolvedValue(overrides?.existingOrder ?? null),
      save: jest.fn(<T>(entity: T): Promise<T> => Promise.resolve(entity)),
      count: jest.fn(),
      findAndCount: jest.fn(),
    };
    const manager = {
      create: jest.fn((_entity: unknown, data: EntityLike): EntityLike => data),
      save: jest.fn((entity: EntityLike | EntityLike[]) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 9, ...entity });
      }),
      exists: jest.fn().mockResolvedValue(false),
    };
    const dataSource = {
      transaction: jest.fn(
        (callback: (managerArg: typeof manager) => Promise<unknown>) =>
          callback(manager),
      ),
    };
    const service = new OrderManagementService(
      menuRepo as never,
      orderRepo as never,
      dataSource as never,
    );

    return { service, menuRepo, orderRepo, order };
  }

  it('requires a room number or phone number', async () => {
    const { service } = createService();

    await expect(
      service.createOrder({
        hotel_id: 1,
        items: [{ menu_item_id: 1, quantity: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns the existing order for the same idempotency key', async () => {
    const existingOrder = {
      id: 3,
      hotel_id: 1,
      service_id: null,
      order_code: 'FB2605291234',
      room_number: '101',
      customer_name: null,
      customer_phone: null,
      note: null,
      status: 'new',
      total_amount: '50000',
      rejected_reason: null,
      items: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    const { service, menuRepo } = createService({ existingOrder });

    const result = await service.createOrder({
      hotel_id: 1,
      room_number: '101',
      idempotency_key: 'same-cart',
      items: [{ menu_item_id: 1, quantity: 1 }],
    });

    expect(result.id).toBe(3);
    expect(menuRepo.find).not.toHaveBeenCalled();
  });

  it('rejects invalid status transitions', async () => {
    const { service, orderRepo, order } = createService({
      orderStatus: 'new',
    });
    orderRepo.findOne.mockResolvedValue(order);

    await expect(
      service.updateOrderStatus(9, { status: 'completed' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows the accepted to preparing transition', async () => {
    const { service, orderRepo, order } = createService({
      orderStatus: 'accepted',
    });
    orderRepo.findOne.mockResolvedValue(order);

    const result = await service.updateOrderStatus(9, { status: 'preparing' });

    expect(result.status).toBe('preparing');
  });
});
