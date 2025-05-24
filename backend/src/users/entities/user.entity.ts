import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Product } from '../../movements/entities/movement.entity';
import { Role } from './role.entity';

@Entity()
export class User extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  image;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @ManyToOne(() => Role, role => role.users, { nullable: true })
  @JoinColumn({
    name: 'id_role',
  })
  role: Role;

  @OneToMany(() => Product, product => product.user)
  products: Product[];
}
