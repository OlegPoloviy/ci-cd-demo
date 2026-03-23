import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ProfileEntity } from './profile.entity';
import { Exclude } from 'class-transformer';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @OneToOne(() => ProfileEntity, {
    cascade: ['insert', 'update'],
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'profile_id' })
  profile?: ProfileEntity | null;

  @Exclude()
  @Column({ select: false, nullable: true })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 255,
    array: true,
    default: () => 'ARRAY[]::text[]',
  })
  roles: string[];

  @Column({
    type: 'varchar',
    length: 255,
    array: true,
    default: () => 'ARRAY[]::text[]',
  })
  scopes: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
