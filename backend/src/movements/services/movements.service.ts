import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { escapeLike } from '../../core/util/escape-like';
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
      where.name = ILike(`%${escapeLike(params.name)}%`);
    }

    if (params?.categoryId) {
      where.category = { id: params.categoryId };
    }

    if (params?.from && params?.to) {
      where.date = Between(params.from, params.to);
    } else if (params?.from) {
      where.date = MoreThanOrEqual(params.from);
    } else if (params?.to) {
      where.date = LessThanOrEqual(params.to);
    }

    const income =
      params?.income ?? (params?.type === 'income' ? true : params?.type === 'expense' ? false : undefined);
    if (income !== undefined) {
      where.income = income;
    }

    return this.productRepo.find({
      relations: ['category'],
      take: limit,
      skip: offset,
      where,
      order: { date: 'DESC' },
    });
  }

  public async getSummary(userId: number, from?: Date, to?: Date) {
    const qb = this.productRepo
      .createQueryBuilder('movement')
      .leftJoin('movement.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'name')
      .addSelect(`COALESCE(SUM(CASE WHEN movement.income THEN movement.quantity ELSE 0 END), 0)`, 'income')
      .addSelect(`COALESCE(SUM(CASE WHEN movement.income THEN 0 ELSE movement.quantity END), 0)`, 'expense')
      .where('movement.id_user = :userId', { userId })
      .groupBy('category.id')
      .addGroupBy('category.name');

    if (from) {
      qb.andWhere('movement.date >= :from', { from });
    }
    if (to) {
      qb.andWhere('movement.date <= :to', { to });
    }

    const rows: Array<{ categoryId: number | null; name: string | null; income: string; expense: string }> =
      await qb.getRawMany();

    const byCategory = rows.map(row => ({
      categoryId: row.categoryId ?? null,
      name: row.name ?? 'Sin categoría',
      income: Number(row.income) || 0,
      expense: Number(row.expense) || 0,
    }));

    const income = byCategory.reduce((acc, row) => acc + row.income, 0);
    const expense = byCategory.reduce((acc, row) => acc + row.expense, 0);

    return {
      from: from ?? null,
      to: to ?? null,
      income,
      expense,
      balance: income - expense,
      byCategory,
    };
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
      product.category = await this.categoryService.assertUsableBy(payload.categoryId, userId);
    }
    return this.productRepo.save(product);
  }

  public async update(id: number, payload: UpdateMovementDto, userId: number) {
    let product = await this.findOne(id, userId);
    if (payload?.categoryId) {
      product.category = await this.categoryService.assertUsableBy(payload.categoryId, userId);
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
