import chalk from 'chalk';
import { kebabCase } from 'lodash';

export enum Strategy {
    RELEASE,
    BUILD,
    VERSION,
    __NONE
}


export function getStrategy(procesArgs: string[] = process.argv): Strategy {
    // console.log(JSON.stringify(procesArgs))
    let strategy: Strategy = Strategy.__NONE;
    for (let enumMember in Strategy) {
        let isValueProperty = parseInt(enumMember, 10) >= 0;
        const arg = kebabCase(Strategy[enumMember].toString());
        // console.log('arg', arg)
        // console.log('isValueProperty', isValueProperty)
        if (isValueProperty && procesArgs.filter(a => a === `--${arg}`).length > 0) {
            // console.log('IAM HERE')
            return parseInt(enumMember, 10);
        }
    }
    return strategy;
}
