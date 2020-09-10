//#region  @backend
import BENCHMARKS from './BENCHMARK/BENCHMARK-TNP-PROJECTS.backend';
import COMPILERS from './COMPILERS-TESTING/COMPILERS.backend';
import { DB } from 'tnp-db';
import DEPS from './DEPENDENCIES-MANAGEMENT/DEPS.backend';
import NEW from './NEW-PROJECT_FILES_MODULES/NEW.backend';
import BUILD from './PROJECTS-DEVELOPMENT/BUILD.backend';
import BRANDING from './PROJECTS-DEVELOPMENT/BRANDING.backend';
import DEVELOP from './PROJECTS-DEVELOPMENT/DEVELOP.backend';
import TESTS from './PROJECTS-DEVELOPMENT/TESTS';
import FILES_STRUCTURE from './PROJECTS-DEVELOPMENT/FILES_STRUCTURE';
import VSCODE from './VSCODE-EXT/VSCODE.backend';
import GIT from './VSCODE-EXT/GIT.backend';
import OPEN from './VSCODE-EXT/OPEN.backend';
import OTHER from './OTHER.backend';
import HELP from './HELP.backend';
import DAEMON from './DAEMON.backend';
import BASH_CONFIG from './BASH-CONFIG.backend';

export default [
  BENCHMARKS,
  COMPILERS,
  DB,
  DEPS,
  NEW,
  BUILD,
  BRANDING,
  DEVELOP,
  TESTS,
  FILES_STRUCTURE,
  VSCODE,
  GIT,
  OPEN,
  OTHER,
  HELP,
  DAEMON,
  BASH_CONFIG
]

//#endregion
