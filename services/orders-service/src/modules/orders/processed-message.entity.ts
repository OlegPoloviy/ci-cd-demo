import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('processed_messages')
export class ProcessedMessagesEntity {
  @PrimaryColumn({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @Column({ type: 'timestamptz', name: 'processed_at' })
  processedAt: Date;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  handler: string | null;
}