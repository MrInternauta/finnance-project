import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1795816652908 implements MigrationInterface {
    name = 'Migration1795816652908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "budget" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateAt" TIMESTAMP, "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "amount" real NOT NULL, "id_user" integer NOT NULL, "id_category" integer NOT NULL, CONSTRAINT "PK_9af87bcfd2de21bd9630dddaa0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "budget" ADD CONSTRAINT "FK_a14d5a3a028e1d2e4eb7c6a385e" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budget" ADD CONSTRAINT "FK_264a91fa8f44da9eb0477121c67" FOREIGN KEY ("id_category") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget" DROP CONSTRAINT "FK_264a91fa8f44da9eb0477121c67"`);
        await queryRunner.query(`ALTER TABLE "budget" DROP CONSTRAINT "FK_a14d5a3a028e1d2e4eb7c6a385e"`);
        await queryRunner.query(`DROP TABLE "budget"`);
    }

}
