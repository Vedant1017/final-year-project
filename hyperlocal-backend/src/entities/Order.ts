import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Shop } from './Shop';
import { OrderItem } from './OrderItem';

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: User;

  @Column({ type: 'uuid', name: 'shop_id' })
  shopId!: string;

  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shop_id' })
  shop!: Shop;

  @Column({ type: 'text' })
  status!: OrderStatus;

  @Column({ type: 'timestamptz', name: 'pickup_slot', nullable: true })
  pickupSlot!: Date | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount', default: 0 })
  totalAmount!: string;

  @OneToMany(() => OrderItem, (oi) => oi.order)
  items!: OrderItem[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

