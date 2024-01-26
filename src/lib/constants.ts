import { Models } from "tnp-models/src";
import type { Project } from "./project/abstract";

export const argsToClear = [
  'websql',
  'serveApp',
  'skipNodeModules',
  'skipCopyToSelection',
  'skipSmartContainerDistBundleInit',
  'copyto',
  'port',
  'branding',
  'struct',
  'verbose',
];

export const folder_shared_folder_info = 'shared_folder_info.txt';

export const TEMP_DOCS = 'tmp-documentation';

export const DEFAULT_PORT = {
  BUNDLE_SERVER_DOCS: 4000,
  APP_BUILD_LOCALHOST: 4200,
  SERVER_LOCALHOST: 4199,
}

export const tmpBuildPort = 'tmp-build-port';

export const PortUtils = (basePort: number) => {

  /**
   * max childs
   */
  const max = 20;
  const n = ((basePort - (basePort % 1000)) / 1000);
  return {
    get calculateFor() {
      return {
        get standaloneServer() {
          const portForStandalone = basePort + 400 + n
          return portForStandalone;
        },
        containerServer(index: number) {
          return basePort + 500 + (n * max) + index;
        }
      }
    },
    appHostTemplateFor(backendPort: number, project: Project) {
      //#region @backendFunc
      const clientPorts = (project.isStandaloneProject && !project.isSmartContainerTarget) ? `
export const CLIENT_DEV_NORMAL_APP_PORT = ${project.standaloneNormalAppPort};
export const CLIENT_DEV_WEBSQL_APP_PORT = ${project.standaloneWebsqlAppPort};
      `: ''

      return `
// THIS FILE IS GENERATED - DO NOT MODIFY

export const HOST_BACKEND_PORT = ${backendPort};
${clientPorts}

// Check yout build info here http://localhost:${basePort}
// NORMAL APP: http://localhost:${project.standaloneNormalAppPort}
// WEBSQL APP: http://localhost:${project.standaloneWebsqlAppPort}

// THIS FILE IS GENERATED - DO NOT MODIFY
`.trim()
      //#endregion
    }
  }
}

export const notAllowedProjectNames = [
  'app',
  'apps',
  'libs',
  'lib',
  'src',
  'migrations',
  'assets',
  'assets-for',
  'browser',
  'websql',
  'compiled',
  'docs',
  '_',
]


export function tempSourceFolder(outDir: Models.dev.BuildDir, appForLib: boolean, websql: boolean) {
  return `tmp-src-${appForLib ? 'app-' : ''}${outDir}${websql ? '-websql' : ''}`
}


export const MESSAGES = {
  SHUT_DOWN_FOLDERS_AND_DEBUGGERS: 'Please shut down your code debugger and any open windows from node_modules and press any key...'
}


export const ONLY_COPY_ALLOWED = [
  'background-worker-process',
  'better-sqlite3',
  '.bin',
  '.install-date',
];
