import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';

@Entity({
  name: 'budget',
})
export class Budget extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'real' })
  amount: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'id_user',
  })
  user: User;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({
    name: 'id_category',
  })
  category: Category;
}
