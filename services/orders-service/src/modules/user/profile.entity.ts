import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('profile')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: true })
  firstName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: true })
  lastName?: string | null;

  @Column({
    name: 'preferred_language',
    type: 'varchar',
    length: 8,
    nullable: true,
  })
  preferredLanguage?: string | null;

  // inverse side of the OneToOne relation (User owns the relation via profile_id)
  @OneToOne(() => UserEntity, (user) => user.profile)
  user?: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
