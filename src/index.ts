export { config } from 'tnp-config';
//#region @backend
export { start } from './start.backend';
import { start } from './start.backend';
export * from './global-typings';
export * from './lib';
export default start;
//#endregion

//#region @browser
console.log('firedev in browser');
//#endregion
