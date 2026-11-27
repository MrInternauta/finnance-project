import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { RolesService } from './roles.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let rolesService: { findOneByName: jest.Mock; findOne: jest.Mock };

  const clientRole = { id: 3, name: 'CLIENT' } as Role;

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    rolesService = {
      findOneByName: jest.fn().mockResolvedValue(clientRole),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('create ignores a role sent in the payload and assigns CLIENT', async () => {
    userRepo.findOneBy.mockResolvedValue(null); // findByEmail
    userRepo.create.mockImplementation(entity => entity as User);
    userRepo.save.mockImplementation(async user => user as User);

    const result = await service.create({
      name: 'A',
      lastName: 'B',
      phone: '1',
      email: 'a@b.com',
      password: 'secret',
      image: '',
      role: 1, // tries to self-assign ADMIN — must be ignored
    } as any);

    expect(rolesService.findOneByName).toHaveBeenCalledWith('CLIENT');
    expect(rolesService.findOne).not.toHaveBeenCalled();
    expect(result.role).toEqual(clientRole);
    expect(result.role?.name).not.toBe('ADMIN');
  });

  it('create throws InternalServerErrorException when CLIENT role is missing', async () => {
    userRepo.findOneBy.mockResolvedValue(null);
    userRepo.create.mockImplementation(entity => entity as User);
    rolesService.findOneByName.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'A',
        lastName: 'B',
        phone: '1',
        email: 'a@b.com',
        password: 'secret',
        image: '',
      } as any)
    ).rejects.toThrow('Default CLIENT role not found');
  });

  it('update ignores role changes when caller is not admin', async () => {
    const existing = { id: 5, name: 'old' } as User;
    jest.spyOn(service, 'findOne').mockResolvedValue(existing);
    userRepo.merge.mockImplementation((user, entity) => Object.assign(user, entity) as User);
    userRepo.save.mockImplementation(async user => user as User);

    await service.update(5, { name: 'new', role: 1 } as any, false);

    expect(rolesService.findOne).not.toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalled();
  });

  it('update applies role changes when caller is admin', async () => {
    const existing = { id: 5, name: 'old' } as User;
    const adminRole = { id: 1, name: 'ADMIN' } as Role;
    jest.spyOn(service, 'findOne').mockResolvedValue(existing);
    rolesService.findOne.mockResolvedValue(adminRole);
    userRepo.merge.mockImplementation((user, entity) => Object.assign(user, entity) as User);
    userRepo.save.mockImplementation(async user => user as User);

    const result = await service.update(5, { name: 'new', role: 1 } as any, true);

    expect(rolesService.findOne).toHaveBeenCalledWith(1);
    expect(result.role).toEqual(adminRole);
  });
});
