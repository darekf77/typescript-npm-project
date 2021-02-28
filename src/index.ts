export { config } from 'tnp-config';
//#region @backend
export { start } from './start.backend';
import { start } from './start.backend';
export * from './global-typings';
//#endregion
export * from './project';
//#region @backend
export * from './project/project-specyfic';
export * from './project/compilers/build-isomorphic-lib';
export default start;
//#endregion
