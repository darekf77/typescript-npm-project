import { Models } from "tnp-models";

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

export const DEFAULT_PORT = {
  BUNDLE_SERVER_DOCS: 4000,
  APP_BUILD_LOCALHOST: 4200,
  WEBSQL_APP_BUILD_LOCALHOST: 4201,
  SERVER_LOCALHOST: 4199,
}

export const notAllowedProjectNames = [
  'app',
  'apps',
  'libs',
  'lib',
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
