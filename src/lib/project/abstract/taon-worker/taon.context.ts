//#region @backend
import { os } from 'tnp-core/src';
//#endregion
import { BaseContext, Taon } from 'taon/src';
import { crossPlatformPath, Helpers, path } from 'tnp-core/src';
import { TaonProjectsController } from './taon.controller';
import { TaonProject } from './taon-project.entity';
import { TaonBuild } from './taon-build.entity';
import { config } from 'tnp-config/src';
import { TaonEnv } from './taon-env.entity';
import { MIGRATIONS_CLASSES_FOR_TaonProjectsContext } from '../../../../migrations';

//#region @backend
const taonProjectsWorkerDatabaseLocation = crossPlatformPath([
  os.userInfo().homedir,
  `.taon/databases-for-services/taon-projects-worker.sqlite`,
]);
if (!Helpers.exists(path.dirname(taonProjectsWorkerDatabaseLocation))) {
  Helpers.mkdirp(path.dirname(taonProjectsWorkerDatabaseLocation));
}
//#endregion

export const TaonProjectsContext = Taon.createContext(() => ({
  contextName: 'TaonProjectsContext',
  contexts: { BaseContext },
  controllers: { TaonProjectsController },
  entities: { TaonProject, TaonBuild, TaonEnv },
  migrations: { ...MIGRATIONS_CLASSES_FOR_TaonProjectsContext },
  skipWritingServerRoutes:
    config.frameworkNames.productionFrameworkName === config.frameworkName,
  //#region @backend
  database: {
    location: taonProjectsWorkerDatabaseLocation,
  },
  //#endregion
  logs: {
    // framework: true,
  },
}));
