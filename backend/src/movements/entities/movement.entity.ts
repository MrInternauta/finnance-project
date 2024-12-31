import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Category } from './category.entity';
import { User } from '../../users/entities/user.entity';

/* eslint-disable prettier/prettier */
@Entity({
  name: 'movement',
}) //naming table
@Index(['name', 'date', 'category', 'income'], { unique: true }) //naming index
export class Product extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    unique: false,
  })
  name: string;

  @Column({
    type: 'timestamptz',
    name: 'date',
    default: () => 'now()',
  })
  date: Date;

  @Column({ type: 'real' })
  quantity = 0;

  @Column({ type: 'boolean' })
  income = false;

  @Column({
    type: 'text',
  })
  description = '';

  @ManyToOne(() => Category, category => category.products, { nullable: true })
  @JoinColumn({
    name: 'id_category',
  }) //naming  n to 1
  category?: Category;

  @ManyToOne(() => User, user => user.products)
  // La que tiene relacion many to one, tiene la llave foranea @JoinColumn()
  @JoinColumn({
    name: 'id_user',
  }) //naming  n to 1
  user: User;
}
