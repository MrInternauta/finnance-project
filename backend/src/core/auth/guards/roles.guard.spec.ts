import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '../models/roles.model';
import { RolesGuard } from './roles.guard';

function buildContext(userRole: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { sub: 1, role: userRole } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { get: jest.Mock };

  beforeEach(() => {
    reflector = { get: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows when no roles metadata is set', async () => {
    reflector.get.mockReturnValue(undefined);
    expect(await guard.canActivate(buildContext('anything'))).toBe(true);
  });

  it('treats client_pro as satisfying CUSTOMER', async () => {
    reflector.get.mockReturnValue([Role.CUSTOMER]);
    expect(await guard.canActivate(buildContext('client_pro'))).toBe(true);
  });

  it('treats CLIENT_PRO (uppercase) as satisfying CUSTOMER', async () => {
    reflector.get.mockReturnValue([Role.CUSTOMER]);
    expect(await guard.canActivate(buildContext('CLIENT_PRO'))).toBe(true);
  });

  it('rejects a client for an ADMIN-only endpoint', async () => {
    reflector.get.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(buildContext('client'))).toThrow(UnauthorizedException);
  });

  it('rejects client_pro for an ADMIN-only endpoint', async () => {
    reflector.get.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(buildContext('client_pro'))).toThrow(UnauthorizedException);
  });

  it('allows admin for an ADMIN endpoint', async () => {
    reflector.get.mockReturnValue([Role.ADMIN]);
    expect(await guard.canActivate(buildContext('admin'))).toBe(true);
  });
});
