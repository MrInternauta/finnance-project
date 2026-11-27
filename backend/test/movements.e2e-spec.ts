import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as request from 'supertest';

import { AppModule } from './../src/app.module';

/**
 * Ownership / authorization e2e.
 * Requires a migrated database (see test:e2e run instructions in the repo docs):
 * the spec seeds default values through GET /api/setDefaultValues first so the
 * CLIENT role and categories exist.
 */
describe('Movements ownership (e2e)', () => {
  let app: INestApplication;
  let server: any;

  const stamp = Date.now();
  const userA = {
    name: 'User',
    lastName: 'A',
    phone: '1111111111',
    email: `user-a-${stamp}@test.com`,
    password: 'passwordA123',
  };
  const userB = {
    name: 'User',
    lastName: 'B',
    phone: '2222222222',
    email: `user-b-${stamp}@test.com`,
    password: 'passwordB123',
  };
  const userC = {
    name: 'User',
    lastName: 'C',
    phone: '3333333333',
    email: `user-c-${stamp}@test.com`,
    password: 'passwordC123',
  };

  let tokenA: string;
  let tokenB: string;
  let movementId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    await app.init();
    server = app.getHttpServer();

    await request(server)
      .get('/api/setDefaultValues')
      .set('auth', process.env.API_KEY || '')
      .expect(200);
  }, 90000);

  afterAll(async () => {
    await app.close();
  });

  it('unauthenticated GET /movements returns 401', async () => {
    await request(server).get('/api/movements').expect(401);
  });

  it('signs up user A and user B', async () => {
    await request(server).post('/api/users').send(userA).expect(200);
    await request(server).post('/api/users').send(userB).expect(200);
  });

  it('sign-up with an admin role id in the payload still yields CLIENT', async () => {
    const res = await request(server)
      .post('/api/users')
      .send({ ...userC, role: 1 })
      .expect(200);
    expect(res.body.user.role).toBeDefined();
    expect(res.body.user.role.name).toBe('CLIENT');
  });

  it('logs in both users', async () => {
    const resA = await request(server)
      .post('/api/auth')
      .send({ email: userA.email, password: userA.password })
      .expect(201);
    tokenA = resA.body.access_token;
    expect(tokenA).toBeTruthy();

    const resB = await request(server)
      .post('/api/auth')
      .send({ email: userB.email, password: userB.password })
      .expect(201);
    tokenB = resB.body.access_token;
    expect(tokenB).toBeTruthy();
  });

  it('user A creates a movement', async () => {
    const res = await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Coffee', date: new Date().toISOString(), quantity: 50, income: false })
      .expect(200);
    movementId = res.body.movement.id;
    expect(movementId).toBeTruthy();
  });

  it('user B does not see user A movement in GET /movements', async () => {
    const res = await request(server).get('/api/movements').set('Authorization', `Bearer ${tokenB}`).expect(200);
    const ids = (res.body.movements || []).map((m: any) => m.id);
    expect(ids).not.toContain(movementId);
  });

  it('user B gets 404 on GET /movements/:id for user A movement', async () => {
    await request(server).get(`/api/movements/${movementId}`).set('Authorization', `Bearer ${tokenB}`).expect(404);
  });

  it('user B gets 404 on PUT /movements/:id for user A movement', async () => {
    await request(server)
      .put(`/api/movements/${movementId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked' })
      .expect(404);
  });

  it('user B gets 404 on DELETE /movements/:id for user A movement', async () => {
    await request(server).delete(`/api/movements/${movementId}`).set('Authorization', `Bearer ${tokenB}`).expect(404);
  });

  it('user A can read, update and delete their own movement', async () => {
    await request(server).get(`/api/movements/${movementId}`).set('Authorization', `Bearer ${tokenA}`).expect(200);

    await request(server)
      .put(`/api/movements/${movementId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Coffee updated', quantity: 60 })
      .expect(200);

    await request(server).delete(`/api/movements/${movementId}`).set('Authorization', `Bearer ${tokenA}`).expect(200);
  });
});
