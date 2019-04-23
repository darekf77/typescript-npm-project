import { EnvConfig } from './env-config';

export interface ReplaceOptionsExtended {

  replacements: (string | [string, string] | [string, (expression: any,env: EnvConfig) => () => boolean])[];
  env?: EnvConfig
}
