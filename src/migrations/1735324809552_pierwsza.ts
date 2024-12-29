import { Taon } from 'taon/src';
import { QueryRunner } from 'taon-typeorm/src';

@Taon.Migration({
  className: 'MainContext_1735324809552_pierwsza',
})
export class MainContext_1735324809552_pierwsza extends Taon.Base.Migration {
  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
  }
}
