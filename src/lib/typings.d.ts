import { Models } from 'tnp-models/src';


declare global {
  const ENV: Models.env.EnvConfig;
}

declare module "*.json" {
  const value: any;
  export default value;
}
