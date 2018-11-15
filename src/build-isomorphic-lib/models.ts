

export interface ReplaceOptionsExtended {

    replacements: (string | [string, string] | [string, (expression: any) => () => boolean])[];
}

