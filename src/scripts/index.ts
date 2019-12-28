//#region  @backend
import COMPILERS from './COMPILERS-TESTING/COMPILERS.backend';
import DB from './DB/DB.backend';
import DEPS from './DEPENDENCIES-MANAGEMENT/DEPS.backend';
import NEW from './NEW-PROJECT_FILES_MODULES/NEW.backend';
import BUILD from './PROJECTS-DEVELOPMENT/BUILD.backend';
import BRANDING from './PROJECTS-DEVELOPMENT/BRANDING.backend';
import DEVELOP from './PROJECTS-DEVELOPMENT/DEVELOP.backend';
import GITHUB from './PROJECTS-DEVELOPMENT/GITHUB.backend';
import TESTS from './PROJECTS-DEVELOPMENT/TESTS';
import FILES_STRUCTURE from './PROJECTS-DEVELOPMENT/FILES_STRUCTURE';
import VSCODE from './VSCODE-EXT/VSCODE.backend';
import GIT from './VSCODE-EXT/GIT.backend';
import OPEN from './VSCODE-EXT/OPEN.backend';
import OTHER from './OTHER.backend';
import HELP from './HELP';
import BASH_CONFIG from './BASH-CONFIG.backend';

export default [
  COMPILERS,
  DB,
  DEPS,
  NEW,
  BUILD,
  BRANDING,
  DEVELOP,
  GITHUB,
  TESTS,
  FILES_STRUCTURE,
  VSCODE,
  GIT,
  OPEN,
  OTHER,
  HELP,
  BASH_CONFIG
]

//#endregion
