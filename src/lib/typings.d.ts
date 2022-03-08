import { Models } from 'tnp-models';


declare global {
  const ENV: Models.env.EnvConfig;
}

declare module "*.json" {
  const value: any;
  export default value;
}
