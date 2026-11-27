import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ILike, IsNull, Not, Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { escapeLike } from '../../core/util/escape-like';
import { User } from '../../users/entities/user.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';

export interface Requester {
  userId: number;
  isAdmin: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private categoryRepo: Repository<Category>) {}

  /** Global defaults (user IS NULL) + the requester's own categories. limit/offset params are accepted but ignored. */
  findVisible(_params: FilterDto | undefined, userId: number) {
    return this.categoryRepo.find({
      relations: ['user'],
      where: [{ user: IsNull() }, { user: { id: userId } }],
      order: { name: 'ASC' },
    });
  }

  async findOneVisible(id: number, userId: number) {
    const category = await this.categoryRepo.findOne({
      relations: ['user'],
      where: [
        { id, user: IsNull() },
        { id, user: { id: userId } },
      ],
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  findById(categoryId: number) {
    return this.categoryRepo.findOne({
      relations: ['user'],
      where: { id: categoryId },
    });
  }

  /** Throws BadRequestException when the category does not exist or is not usable by the user. */
  async assertUsableBy(categoryId: number, userId: number) {
    const category = await this.findById(categoryId);
    const ownerId = category?.user?.id ?? null;
    if (!category || (ownerId !== null && ownerId !== userId)) {
      throw new BadRequestException('Invalid category');
    }
    return category;
  }

  private async validateNameAvailable(name: string, userId: number, excludeId?: number) {
    const escaped = escapeLike(name);
    const clashes = await this.categoryRepo.find({
      where: [
        { name: ILike(escaped), user: IsNull(), ...(excludeId ? { id: Not(excludeId) } : {}) },
        { name: ILike(escaped), user: { id: userId }, ...(excludeId ? { id: Not(excludeId) } : {}) },
      ],
      take: 1,
    });
    if (clashes.length > 0) {
      throw new BadRequestException(`Category with name '${name}' already exists`);
    }
  }

  /** Loads any category (including soft-deleted) with its owner. */
  private async findAny(id: number, withDeleted = false) {
    return this.categoryRepo.findOne({
      relations: ['user'],
      where: { id },
      withDeleted,
    });
  }

  /** Enforces: another user's category -> NotFound; a default category -> only admin (else Forbidden). */
  private async assertManageable(id: number, requester: Requester, withDeleted = false) {
    const category = await this.findAny(id, withDeleted);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    const ownerId = category.user?.id ?? null;
    if (ownerId === null) {
      if (!requester.isAdmin) {
        throw new ForbiddenException('Default categories can only be managed by an admin');
      }
    } else if (ownerId !== requester.userId) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(category: CreateCategoryDto, requester: Requester) {
    await this.validateNameAvailable(category.name, requester.userId);
    const newCategory = this.categoryRepo.create({
      ...category,
      user: requester.isAdmin ? null : ({ id: requester.userId } as User),
    });
    return await this.categoryRepo.save(newCategory);
  }

  async update(id: number, changes: UpdateCategoryDto, requester: Requester) {
    const category = await this.assertManageable(id, requester);
    if (changes.name) {
      await this.validateNameAvailable(changes.name, requester.userId, id);
    }
    this.categoryRepo.merge(category, changes);
    return this.categoryRepo.save(category);
  }

  async remove(id: number, requester: Requester) {
    await this.assertManageable(id, requester);
    return this.categoryRepo.softDelete({ id });
  }

  async restore(id: number, requester: Requester) {
    await this.assertManageable(id, requester, true);
    return this.categoryRepo.restore({ id });
  }

  defaultValue() {
    return [
      {
        name: 'SUELDO',
      },
      {
        name: 'INVERSIONES',
      },
      {
        name: 'ALOJAMIENTO',
      },
      {
        name: 'ENTRETENIMIENTO',
      },
      {
        name: 'TRANSPORTE',
      },
      {
        name: 'GTS_PERSONALES',
      },
      {
        name: 'SEGUROS',
      },
      {
        name: 'CREDITO',
      },
      {
        name: 'COMIDA',
      },
      {
        name: 'AHORRO',
      },
      {
        name: 'APRENDIZAJE',
      },
      {
        name: 'REGALOS',
      },
      {
        name: 'CUIDADO_PERSONAL',
      },
      {
        name: 'METAS',
      },
      {
        name: 'OTROS',
      },
    ];
  }
}
