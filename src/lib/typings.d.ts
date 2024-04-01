import { Models } from './models';


declare global {
  const ENV: Models.EnvConfig;
}

declare module "*.json" {
  const value: any;
  export default value;
}
// @ts-ignore
