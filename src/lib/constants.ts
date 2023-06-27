import { config } from "tnp-config";
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

export const extForStyles = [
  'scss',
  'css',
  'less',
  'sass',
].map(ext => `.${ext}`);

export const extAllowedToReplace = [
  ...extForStyles,
  ...[
    'html',
    'ts',
  ].map(ext => `.${ext}`),
];


export const frontendFiles = [
  '.browser.ts',
  '.component.ts',
  '.container.ts',
  '.directive.ts',
  '.pipe.ts',
  '.module.ts',
  '.service.ts',
  '.store.ts',
  '.actions.ts',
  '.effects.ts',
  '.reducers.ts',
  '.selectors.ts',
]

export const frontEndOnly = [
  '.spec.ts',
  '.e2e.ts',
  '.e2e-spec.ts',
  '.html',
  ...extForStyles,
  ...frontendFiles,
  // '.test.ts',
]


export const appRelatedFiles = [
  ...extAllowedToReplace.map(ext => `app${ext}`),
  ...frontendFiles.map(ext => `app${ext}`),
  'app.models.ts',
  'app.store.ts',
  'app.constants.ts',
];

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
