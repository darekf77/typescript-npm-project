
//#region @backend
export { start } from './start.backend';
import { Ora } from 'ora';
//#endregion
import { Models } from 'tnp-models';

export * from './global-typings';
export type EnvConfig = Models.env.EnvConfig;
export type EnvironmentName = Models.env.EnvironmentName;

export * from './config';

export * from './project';
//#region @backend
export * from './project/project-specyfic';
//#endregion

export * from 'tnp-models';

//#region @backend
export * from './project/compilers/build-isomorphic-lib';

import { config } from './environment-config';
export default { config };
//#endregion
