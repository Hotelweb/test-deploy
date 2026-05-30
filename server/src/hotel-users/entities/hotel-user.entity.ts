import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity.js';

export enum HotelStaffRole {
  HOTEL_ADMIN = 'hotel_admin',
  RECEPTION = 'reception',
  CASHIER = 'cashier',
  FNB_STAFF = 'fnb_staff',
  KITCHEN_STAFF = 'kitchen_staff',
  CUSTOMER_CARE = 'customer_care',
  CONTENT_MANAGER = 'content_manager',
  MANAGER = 'manager',
}

/**
 * A hotel-scoped staff account.
 *
 * The system has only two user types: a single root system admin (table
 * `system_admins`) and per-hotel staff users (this table). `role` is retained
 * as the primary/legacy role while `roles` enables flexible combined scopes.
 * Permissions are derived in auth/permissions.ts.
 */
@Entity('hotel_users')
export class HotelUser {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  hotel_id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({
    type: 'enum',
    enum: HotelStaffRole,
    enumName: 'hotel_staff_role',
    default: HotelStaffRole.HOTEL_ADMIN,
  })
  role: HotelStaffRole;

  @Column({
    type: 'enum',
    enum: HotelStaffRole,
    enumName: 'hotel_staff_role',
    array: true,
    nullable: true,
  })
  roles: HotelStaffRole[] | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
