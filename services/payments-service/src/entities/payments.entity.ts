import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('payments')
export class PaymentsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ type: 'numeric' })
  amount: number;

  @Column()
  currency: string;

  @Column({ unique: true, nullable: true })
  idempotencyKey: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  providerRef: string;

  @CreateDateColumn()
  createdAt: Date;
}
