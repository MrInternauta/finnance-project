import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1735627479683 implements MigrationInterface {
    name = 'Migration1735627479683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movement" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "quantity" real NOT NULL, "income" boolean NOT NULL, "description" text NOT NULL, "id_category" integer, "id_user" integer, CONSTRAINT "PK_079f005d01ebda984e75c2d67ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b63f451e03cb22b739fc5b6e18" ON "movement" ("name", "date", "id_category", "income") `);
        await queryRunner.query(`CREATE TABLE "user" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "phone" character varying(255) NOT NULL, "image" character varying NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "id_role" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permission" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255) NOT NULL, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permission_role" ("id_category" integer NOT NULL, "id_role" integer NOT NULL, CONSTRAINT "PK_bae85303344227e180759c482e2" PRIMARY KEY ("id_category", "id_role"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3afb9805a4d3c8ef217250eeec" ON "permission_role" ("id_category") `);
        await queryRunner.query(`CREATE INDEX "IDX_4206b87fef57d4d8e3beb58efe" ON "permission_role" ("id_role") `);
        await queryRunner.query(`ALTER TABLE "movement" ADD CONSTRAINT "FK_c312f1822a9eb0f089a5b3c27ec" FOREIGN KEY ("id_category") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movement" ADD CONSTRAINT "FK_668b48f45a180b542ff26a9f48e" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_1a3abee4bf37fa00ebd698cedec" FOREIGN KEY ("id_role") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permission_role" ADD CONSTRAINT "FK_3afb9805a4d3c8ef217250eeecb" FOREIGN KEY ("id_category") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "permission_role" ADD CONSTRAINT "FK_4206b87fef57d4d8e3beb58efe1" FOREIGN KEY ("id_role") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permission_role" DROP CONSTRAINT "FK_4206b87fef57d4d8e3beb58efe1"`);
        await queryRunner.query(`ALTER TABLE "permission_role" DROP CONSTRAINT "FK_3afb9805a4d3c8ef217250eeecb"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_1a3abee4bf37fa00ebd698cedec"`);
        await queryRunner.query(`ALTER TABLE "movement" DROP CONSTRAINT "FK_668b48f45a180b542ff26a9f48e"`);
        await queryRunner.query(`ALTER TABLE "movement" DROP CONSTRAINT "FK_c312f1822a9eb0f089a5b3c27ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4206b87fef57d4d8e3beb58efe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3afb9805a4d3c8ef217250eeec"`);
        await queryRunner.query(`DROP TABLE "permission_role"`);
        await queryRunner.query(`DROP TABLE "permission"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b63f451e03cb22b739fc5b6e18"`);
        await queryRunner.query(`DROP TABLE "movement"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }

}
