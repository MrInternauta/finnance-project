import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as request from 'supertest';

import { AppModule } from './../src/app.module';
import { MailService } from './../src/core/auth/services/mail.service';

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
  let categoryAId: number;
  let budgetId: number;
  const mailMock = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mailMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
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

  it('user A creates their own category', async () => {
    const res = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'CategoriaDeA' })
      .expect(200);
    categoryAId = res.body.product.id;
    expect(categoryAId).toBeTruthy();
    expect(res.body.product.user?.id).toBeTruthy();
  });

  it('user B cannot see user A category (404)', async () => {
    await request(server).get(`/api/categories/${categoryAId}`).set('Authorization', `Bearer ${tokenB}`).expect(404);

    const list = await request(server)
      .get('/api/categories?limit=50')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    const ids = (list.body.categories || []).map((c: any) => c.id);
    expect(ids).not.toContain(categoryAId);
  });

  it('user B cannot modify or delete user A category (404)', async () => {
    await request(server)
      .put(`/api/categories/${categoryAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Stolen' })
      .expect(404);
    await request(server).delete(`/api/categories/${categoryAId}`).set('Authorization', `Bearer ${tokenB}`).expect(404);
  });

  it('user B cannot delete a default category (403)', async () => {
    await request(server).delete('/api/categories/1').set('Authorization', `Bearer ${tokenB}`).expect(403);
  });

  it('user B cannot create a movement with user A category (400)', async () => {
    await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Tricky', date: new Date().toISOString(), quantity: 10, income: false, categoryId: categoryAId })
      .expect(400);
  });

  it('summary returns totals for the authenticated user', async () => {
    // user A earlier movement was soft-deleted; create known movements now.
    await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Sueldo', date: new Date().toISOString(), quantity: 1000, income: true, categoryId: 1 })
      .expect(200);
    await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Cena', date: new Date().toISOString(), quantity: 250, income: false, categoryId: categoryAId })
      .expect(200);
    await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Varios', date: new Date().toISOString(), quantity: 50, income: false })
      .expect(200);

    const res = await request(server)
      .get('/api/movements/summary')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const { summary } = res.body;
    expect(summary.income).toBe(1000);
    expect(summary.expense).toBe(300);
    expect(summary.balance).toBe(700);
    const uncategorized = summary.byCategory.find((c: any) => c.categoryId === null);
    expect(uncategorized).toEqual({ categoryId: null, name: 'Sin categoría', income: 0, expense: 50 });

    // user B summary does not include user A movements
    const resB = await request(server)
      .get('/api/movements/summary')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(resB.body.summary.income).toBe(0);
    expect(resB.body.summary.expense).toBe(0);
  });

  it('monthly summary groups the user movements by month', async () => {
    const res = await request(server)
      .get('/api/movements/summary/monthly')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const months = res.body.months;
    expect(months.length).toBe(1);
    const month = months[0];
    expect(month.month).toMatch(/^\d{4}-\d{2}$/);
    expect(month.income).toBe(1000);
    expect(month.expense).toBe(300);
    expect(month.balance).toBe(700);

    const resB = await request(server)
      .get('/api/movements/summary/monthly')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(resB.body.months).toHaveLength(0);
  });

  it('budgets: create, spend tracking, duplicate rejection and ownership', async () => {
    const res = await request(server)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ categoryId: categoryAId, amount: 300 })
      .expect(200);
    budgetId = res.body.budget.id;
    expect(budgetId).toBeTruthy();

    // one active budget per (user, category)
    await request(server)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ categoryId: categoryAId, amount: 100 })
      .expect(400);

    // category must be usable by the requester
    await request(server)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ categoryId: categoryAId, amount: 100 })
      .expect(400);

    // spent = user A expenses in that category (Cena 250)
    const list = await request(server).get('/api/budgets').set('Authorization', `Bearer ${tokenA}`).expect(200);
    const budget = list.body.budgets.find((b: any) => b.id === budgetId);
    expect(budget.category).toEqual({ id: categoryAId, name: 'CategoriaDeA' });
    expect(budget.amount).toBe(300);
    expect(budget.spent).toBe(250);
    expect(budget.remaining).toBe(50);

    // user B cannot see, update or delete user A budget
    const listB = await request(server).get('/api/budgets').set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect((listB.body.budgets || []).map((b: any) => b.id)).not.toContain(budgetId);
    await request(server)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 1 })
      .expect(404);
    await request(server).delete(`/api/budgets/${budgetId}`).set('Authorization', `Bearer ${tokenB}`).expect(404);

    // owner can update and delete
    await request(server)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 400 })
      .expect(200);
    await request(server).delete(`/api/budgets/${budgetId}`).set('Authorization', `Bearer ${tokenA}`).expect(200);
  });

  it('export returns a scoped CSV with headers and sanitized cells', async () => {
    const res = await request(server).get('/api/movements/export').set('Authorization', `Bearer ${tokenA}`).expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('movimientos-');
    expect(res.text.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
    const lines = res.text.split('\r\n');
    expect(lines[0]).toContain('fecha,nombre,categoria,tipo,monto,descripcion');
    expect(res.text).toContain(',Sueldo,');
    expect(res.text).toContain('ingreso');
    expect(res.text).toContain('gasto');

    // user B gets an empty export
    const resB = await request(server)
      .get('/api/movements/export')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(resB.text.split('\r\n')).toHaveLength(1); // BOM + header line only
  });

  it('forgot always answers 200 and only emails when the user exists', async () => {
    const before = mailMock.sendPasswordReset.mock.calls.length;
    const res = await request(server)
      .post('/api/auth/forgot')
      .send({ email: `nobody-${stamp}@test.com` })
      .expect(200);
    expect(res.body.message).toBe('If the email exists, a reset link was sent');
    expect(mailMock.sendPasswordReset.mock.calls.length).toBe(before);

    await request(server).post('/api/auth/forgot').send({ email: userA.email }).expect(200);
    expect(mailMock.sendPasswordReset.mock.calls.length).toBe(before + 1);
  });

  it('reset rejects an invalid token', async () => {
    await request(server).post('/api/auth/reset').send({ token: 'bogus', password: 'whatever1' }).expect(400);
  });

  it('a second forgot invalidates the previous reset token', async () => {
    const lastLink = () => {
      const calls = mailMock.sendPasswordReset.mock.calls;
      return calls[calls.length - 1][1] as string;
    };

    await request(server).post('/api/auth/forgot').send({ email: userA.email }).expect(200);
    const firstToken = new URL(lastLink(), 'http://localhost').searchParams.get('token');

    await request(server).post('/api/auth/forgot').send({ email: userA.email }).expect(200);
    const secondToken = new URL(lastLink(), 'http://localhost').searchParams.get('token');
    expect(secondToken).toBeTruthy();
    expect(secondToken).not.toBe(firstToken);

    await request(server).post('/api/auth/reset').send({ token: firstToken, password: 'staleToken1' }).expect(400);

    const newPassword = 'secondTokenA123';
    await request(server).post('/api/auth/reset').send({ token: secondToken, password: newPassword }).expect(200);
    userA.password = newPassword;
  });

  it('full forgot -> reset -> login flow works', async () => {
    await request(server).post('/api/auth/forgot').send({ email: userA.email }).expect(200);
    const calls = mailMock.sendPasswordReset.mock.calls;
    const link = calls[calls.length - 1][1];
    const rawToken = new URL(link, 'http://localhost').searchParams.get('token');
    expect(rawToken).toBeTruthy();

    const newPassword = 'newPasswordA123';
    await request(server).post('/api/auth/reset').send({ token: rawToken, password: newPassword }).expect(200);

    // old password no longer works
    await request(server).post('/api/auth').send({ email: userA.email, password: userA.password }).expect(401);

    const res = await request(server).post('/api/auth').send({ email: userA.email, password: newPassword }).expect(201);
    expect(res.body.access_token).toBeTruthy();
    userA.password = newPassword;

    // token is single-use
    await request(server).post('/api/auth/reset').send({ token: rawToken, password: 'another1' }).expect(400);
  });

  // Runs last on purpose: the suite already spent 4 of the 5 allowed /auth calls,
  // so the next login is the 5th (allowed) and the one after is throttled.
  it('rate limits the auth endpoints (6th request in a minute -> 429)', async () => {
    const res = await request(server)
      .post('/api/auth')
      .send({ email: 'nobody@nowhere.com', password: 'nope' })
      .expect(401);
    expect(res.status).toBe(401);

    await request(server).post('/api/auth').send({ email: 'nobody@nowhere.com', password: 'nope' }).expect(429);
    await request(server).post('/api/auth').send({ email: 'nobody@nowhere.com', password: 'nope' }).expect(429);
  });
});
