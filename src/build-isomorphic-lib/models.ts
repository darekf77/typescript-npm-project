import { EnvConfig } from '../models';



export interface ReplaceOptionsExtended {

    replacements: (string | [string, string] | [string, (expression: any,env: EnvConfig) => () => boolean])[];
    env?: EnvConfig
}

