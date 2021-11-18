import {MigrationInterface, QueryRunner} from "typeorm";

export class AdministratorMigration1637229492419 implements MigrationInterface {
    name = 'AdministratorMigration1637229492419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`administrators\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userUid\` varchar(64) NOT NULL DEFAULT '', UNIQUE INDEX \`IDX_fe9540e72c7ace21db0e64a09f\` (\`userUid\`), UNIQUE INDEX \`REL_fe9540e72c7ace21db0e64a09f\` (\`userUid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`administrators\` ADD CONSTRAINT \`FK_fe9540e72c7ace21db0e64a09f6\` FOREIGN KEY (\`userUid\`) REFERENCES \`users\`(\`uid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`administrators\` DROP FOREIGN KEY \`FK_fe9540e72c7ace21db0e64a09f6\``);
        await queryRunner.query(`DROP INDEX \`REL_fe9540e72c7ace21db0e64a09f\` ON \`administrators\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe9540e72c7ace21db0e64a09f\` ON \`administrators\``);
        await queryRunner.query(`DROP TABLE \`administrators\``);
    }

}
