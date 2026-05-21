import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto.js';
import { UpdateMenuItemDto } from '../dto/update-menu-item.dto.js';
import { MenuItem } from '../entities/menu-item.entity.js';
import { toMenuView } from '../helpers/food-order-mappers.js';
import type { MenuItemView } from '../types/food-order.types.js';

@Injectable()
export class MenuManagementService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuRepo: Repository<MenuItem>,
  ) {}

  async getPublicMenu(hotelId: number, lang?: string): Promise<MenuItemView[]> {
    const items = await this.menuRepo.find({
      where: {
        hotel_id: hotelId,
        is_available: true,
        deleted_at: IsNull(),
      },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    return items.map((item) => toMenuView(item, lang));
  }

  async getMenuForAdmin(hotelId: number): Promise<MenuItemView[]> {
    const items = await this.menuRepo.find({
      where: { hotel_id: hotelId, deleted_at: IsNull() },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    return items.map((item) => toMenuView(item));
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItemView> {
    const item = this.menuRepo.create({
      hotel_id: dto.hotel_id,
      category: dto.category ?? 'food',
      name: dto.name,
      name_en: dto.name_en ?? null,
      description: dto.description ?? null,
      description_en: dto.description_en ?? null,
      price: String(dto.price),
      image_url: dto.image_url ?? null,
      sort_order: dto.sort_order ?? 0,
      is_available: dto.is_available ?? true,
    });
    const saved = await this.menuRepo.save(item);
    return toMenuView(saved);
  }

  async updateMenuItem(
    id: number,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItemView> {
    const item = await this.findMenuItem(id);
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.name_en !== undefined) item.name_en = dto.name_en;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.description_en !== undefined)
      item.description_en = dto.description_en;
    if (dto.price !== undefined) item.price = String(dto.price);
    if (dto.image_url !== undefined) item.image_url = dto.image_url;
    if (dto.sort_order !== undefined) item.sort_order = dto.sort_order;
    if (dto.is_available !== undefined) item.is_available = dto.is_available;
    const saved = await this.menuRepo.save(item);
    return toMenuView(saved);
  }

  async deleteMenuItem(id: number): Promise<void> {
    const item = await this.findMenuItem(id);
    item.deleted_at = new Date();
    item.is_available = false;
    await this.menuRepo.save(item);
  }

  async findMenuItem(id: number): Promise<MenuItem> {
    const item = await this.menuRepo.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!item) throw new NotFoundException(`Menu item #${id} not found`);
    return item;
  }
}
