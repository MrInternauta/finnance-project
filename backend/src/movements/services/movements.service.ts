import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsWhere, Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { CreateMovementDto, UpdateMovementDto } from '../dtos/movement.dto';
import { MovementsFilterDto } from '../dtos/movementFilter.dto';
import { Product } from '../entities/movement.entity';
import { CategoriesService } from './categories.service';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private categoryService: CategoriesService
  ) {}

  public async findAll(params: MovementsFilterDto | undefined, userId: number) {
    const where: FindOptionsWhere<Product> = { user: { id: userId } };
    if (!params) {
      return this.productRepo.find({
        relations: ['category'],
        where,
        order: { date: 'DESC' },
      });
    }
    const { limit, offset } = params;
    if (params?.name) {
      where.name = params.name;
    }

    if (params?.categoryId) {
      where.category = { id: params.categoryId };
    }

    return this.productRepo.find({
      relations: ['category'],
      take: limit,
      skip: offset,
      where,
      order: { date: 'DESC' },
    });
  }

  public async findOne(idProduct: number, userId: number, whithRelations = true) {
    const product = await this.productRepo.findOne({
      relations: whithRelations ? ['category'] : [],
      where: { id: idProduct, user: { id: userId } },
    });
    if (!product) {
      throw new NotFoundException(`Product ${idProduct} not found`);
    } else {
      return product;
    }
  }

  public async create(payload: CreateMovementDto, userId: number) {
    const product = this.productRepo.create(payload);
    product.user = { id: userId } as User;
    if (payload.categoryId) {
      const categories = await this.categoryService.findById(payload.categoryId);
      product.category = categories;
    }
    return this.productRepo.save(product);
  }

  public async update(id: number, payload: UpdateMovementDto, userId: number) {
    let product = await this.findOne(id, userId);
    if (payload?.categoryId) {
      const categories = await this.categoryService.findById(payload.categoryId);
      product.category = categories;
    }
    product = this.productRepo.merge(product, payload);
    return this.productRepo.save(product);
  }

  public async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.productRepo.softDelete({ id });
  }

  public async restore(id: number, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id, user: { id: userId } },
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return this.productRepo.restore({ id });
  }

  defaultProducts() {
    const defaultProduct: Array<CreateMovementDto & { userId: number }> = [
      {
        categoryId: 1,
        userId: 1,
        name: 'Product 1',
        quantity: 10,
        date: new Date(),
        income: true,
      },
      {
        categoryId: 2,
        userId: 1,
        name: 'Product 2',
        quantity: 40,
        date: new Date(),
        income: true,
      },
      {
        categoryId: 3,
        userId: 1,
        name: 'Product 3',
        quantity: 20,
        date: new Date(),
        income: false,
      },
      {
        categoryId: 4,
        userId: 1,
        name: 'Product 4',
        quantity: 30,
        date: new Date(),
        income: false,
      },
      {
        categoryId: 5,
        userId: 1,
        name: 'Product 5',
        quantity: 50,
        date: new Date(),
        income: true,
      },
    ];
    return defaultProduct;
  }
}
