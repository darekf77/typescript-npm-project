import { CoreModels, _, chalk, path } from 'tnp-core/src';
import { Helpers, UtilsTypescript } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { BuildOptions, ReleaseOptions } from '../../build-options';
import { config } from 'tnp-config/src';

class $Migration extends CommandLineFeature<ReleaseOptions, Project> {
  public _() {
    throw new Error('Method not implemented.');
  }

  //#region create
  async create() {
    const timestamp = new Date().getTime();
    const migrationName = _.camelCase(this.args.join(' '));
    const migrationFileName = `${timestamp}_${migrationName}.ts`;
    const detectedContexts = Helpers.filesFrom(this.project.location)
      .map(f => path.basename(f))
      .filter(f => f.startsWith('db-') && f.endsWith('.sqlite'))
      .map(f => f.replace('.sqlite', '').replace('db-', ''));

    if (detectedContexts.length === 0) {
      Helpers.error(
        `

        No context detected. ${chalk.bold('Please start locally your project first')}.
        You must initialize all your contexts (and databases) before creating a migration.

        `,
        false,
        true,
      );
    }

    const classes = detectedContexts.map(contextName => {
      return `
@Taon.Migration({
  className: '${contextName}_${timestamp}_${migrationName}',
})
export class ${contextName}_${timestamp}_${migrationName} extends Taon.Base.Migration {
    async up(queryRunner: QueryRunner): Promise<any> {
      // do "something" in db
    }

    async down(queryRunner: QueryRunner): Promise<any> {
      // revert this "something" in db
    }
}
      `;
    });

    const absPathToNewMigrationFile = this.project.pathFor([
      config.folder.src,
      config.folder.migrations,
      migrationFileName,
    ]);
    Helpers.writeFile(
      absPathToNewMigrationFile,
      `import { Taon } from 'taon/src';\n` +
        `import { QueryRunner } from 'taon-typeorm/src';\n` +
        `${classes.join('\n\n')}`,
    );
    UtilsTypescript.formatFile(absPathToNewMigrationFile);
    Helpers.info(`Migration file created: ${migrationFileName}`);
    this._exit(0);
  }
  //#endregion

  //#region run
  async run() {
    Helpers.run(`node run.js --onlyMigrationRun`, {
      output: true,
      silence: false,
    }).sync();
    this._exit(0);
  }
  //#endregion

  //#region revert
  async revert() {
    Helpers.run(
      `node run.js --onlyMigrationRevertToTimestamp ${this.firstArg}`,
      {
        output: true,
        silence: false,
      },
    ).sync();
    this._exit(0);
  }
  //#endregion
}

export default {
  $Migration: Helpers.CLIWRAP($Migration, '$Migration'),
};
