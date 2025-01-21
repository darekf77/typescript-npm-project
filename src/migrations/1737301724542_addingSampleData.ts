import { Taon } from 'taon/src';
import { QueryRunner } from 'taon-typeorm/src';
import {
  TaonEnv,
  TaonEnvType,
} from '../lib/project/abstract/taon-worker/taon-env.entity';
import { env } from 'process';

@Taon.Migration({
  className: 'TaonProjectsContext_1737301724542_addingSampleData',
})
export class TaonProjectsContext_1737301724542_addingSampleData extends Taon
  .Base.Migration {
  repoEnv = this.injectRepo(TaonEnv);

  /**
   * IMPORTANT !!!
   * remove this method if you are ready to run this migration
   */
  public isReadyToRun(): boolean {
    return true;
  }

  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
    const environmentNames = [
      'dev',
      'dev2',
      'dev3',
      'dev4',
      'dev5',
      'dev6',
      'dev7',
      'dev8',
      'dev9',
      'test',
      'stage',
      'prod',
    ];
    for (const envName of environmentNames) {
      await this.repoEnv.save(
        TaonEnv.from({
          name: envName,
          type: envName.replace(/[0-9]/g, '') as TaonEnvType,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
    this.repoEnv.clear();
  }
}
