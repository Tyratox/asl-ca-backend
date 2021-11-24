import { MigrationInterface, QueryRunner } from 'typeorm';

export class BindSessionToIp1637762817685 implements MigrationInterface {
  name = 'BindSessionToIp1637762817685';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sessions\` ADD \`ip_address\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`session_id\` \`session_id\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`session_id\` \`session_id\` varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` DROP COLUMN \`ip_address\``,
    );
  }
}
