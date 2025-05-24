import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1747982567572 implements MigrationInterface {
    name = 'Migration1747982567572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "image" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "image" SET NOT NULL`);
    }

}
