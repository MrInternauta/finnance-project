import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from './movement.entity';

@Entity()
export class Category extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  // null = global default category; set = user-owned category (FR-18)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: 'id_user',
  })
  user?: User | null;
}
