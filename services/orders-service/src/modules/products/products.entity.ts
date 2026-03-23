import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderItemEntity } from '../orders/order-item.entity';
import { FileRecordEntity } from '../files/file-record.entity';

@Entity('Products')
@Index('IDX_PRODUCT_PRICE_DESC', ['price'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('numeric', {
    precision: 8,
    scale: 2,
    transformer: {
      to: (value) => value,
      from: (value) => parseFloat(value),
    },
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => OrderItemEntity, (item) => item.product)
  orderItems: OrderItemEntity[];

  @OneToMany(() => FileRecordEntity, (file) => file.product)
  images: FileRecordEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
