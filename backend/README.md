# Finnance Backend

[![Nest Logo](https://nestjs.com/img/logo-small.svg)](http://nestjs.com/)

A progressive [Node.js](http://nodejs.org) framework for building efficient and scalable server-side applications.

[![NPM Version](https://img.shields.io/npm/v/@nestjs/core.svg)](https://www.npmjs.com/~nestjscore)
[![Package License](https://img.shields.io/npm/l/@nestjs/core.svg)](https://www.npmjs.com/~nestjscore)
[![NPM Downloads](https://img.shields.io/npm/dm/@nestjs/common.svg)](https://www.npmjs.com/~nestjscore)
[![CircleCI](https://img.shields.io/circleci/build/github/nestjs/nest/master)](https://circleci.com/gh/nestjs/nest)
[![Coverage](https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9)](https://coveralls.io/github/nestjs/nest?branch=master)
[![Discord](https://img.shields.io/badge/discord-online-brightgreen.svg)](https://discord.gg/G7Qnnhy)
[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
[![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)
[![Donate](https://img.shields.io/badge/Donate-PayPal-ff3f59.svg)](https://paypal.me/kamilmysliwiec)
[![Support us](https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg)](https://opencollective.com/nest#sponsor)
[![Follow](https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow)](https://twitter.com/nestframework)
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Finnance — finnance-project

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Run migrations

```bash
npx gulp --command="migrations:show"
npx gulp --command="migrations:run"
```

## License

Nest is [MIT licensed](LICENSE).

## NestJS Notes

### One to One relations

Para crear relaciones uno a uno debemos hacer:
User to Customer

- User entity

```ts
  @OneToOne(() => Customer, (costumer) => costumer.user, { nullable: true }) //optional relation | Bidirectional relation (ref)
  @JoinColumn() //Join column (only one table, this table contains the foreign key)
  customer: Customer;
```

- Customer entity

```ts
  @OneToOne(() => User, (user) => user.customer, { nullable: true }) //Bidirectional relation (ref)
  user: User;
```

- La entidad que tenga el decorador @JoinColumn es el objeto que llevara la clave foranea.
- En la relación oneToOne solo una entidad puede tener el decorador @JoinColumn.
- En el caso particular de esta relación también puede ser opcional
- TypeORM permite tener una relacion bidireccional en las relaciones 1 a 1 sin necesidad de hacer queryes extras.

sudo chown -R $(whoami) ~/.docker
❯ npx gulp --command="migrations:generate"
❯ npx gulp --command="migrations:run"

## Env config

```text
API_KEY=12345a

POSTGRES_DB=mydb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
POSTGRES_HOST=postgres_service_finnance

POSTGRES_PORT_EXTERNAL=5430
POSTGRES_HOST_EXTERNAL=localhost

JWT_SECRET=abcde123
JWT_EXPIRES_IN=24h

IMAGES_PATH=files/images

# Optional — password reset emails via Resend
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM=Finnance <no-reply@yourdomain>
FRONTEND_URL=http://localhost:8100

# Optional — CORS allowlist (comma-separated; unset = permissive)
# Capacitor apps need capacitor://localhost and http://localhost
CORS_ORIGINS=capacitor://localhost,http://localhost

```
