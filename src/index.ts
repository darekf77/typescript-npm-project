
//#region @backend
export { start } from './start.backend';
//#endregion

export * from './global-typings';

export * from './config';

export * from './project';
//#region @backend
export * from './project/project-specyfic';
export * from './project/compilers/build-isomorphic-lib';
import { config } from './environment-config';
export default { config };
//#endregion
