import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1795814625128 implements MigrationInterface {
    name = 'Migration1795814625128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b63f451e03cb22b739fc5b6e18"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b63f451e03cb22b739fc5b6e18" ON "movement" ("name", "date", "income", "id_category") `);
    }

}
