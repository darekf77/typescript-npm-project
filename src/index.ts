
//#region @backend
export { start } from './start.backend';
import { start } from './start.backend';
//#endregion

export * from './global-typings';

export * from './config';

export * from './project';
//#region @backend
export * from './project/project-specyfic';
export * from './project/compilers/build-isomorphic-lib';
export default start;
//#endregion
