import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  hotel_id: number | null;

  @Column({ type: 'varchar', length: 40 })
  actor_scope: string;

  @Column({ type: 'bigint', nullable: true })
  actor_user_id: number | null;

  @Column({ type: 'varchar', length: 80 })
  action: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  target_type: string | null;

  @Column({ type: 'bigint', nullable: true })
  target_id: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
