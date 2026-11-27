import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1795815327280 implements MigrationInterface {
    name = 'Migration1795815327280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_reset_token" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "token_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "id_user" integer NOT NULL, CONSTRAINT "PK_838af121380dfe3a6330e04f5bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "category" ADD "id_user" integer`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_daf8fdc215d9d18ab8547a0661f" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD CONSTRAINT "FK_24145eb9f6092e62d187ec0688b" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP CONSTRAINT "FK_24145eb9f6092e62d187ec0688b"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_daf8fdc215d9d18ab8547a0661f"`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "id_user"`);
        await queryRunner.query(`DROP TABLE "password_reset_token"`);
    }

}
