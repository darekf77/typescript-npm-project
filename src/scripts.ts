import * as path from 'path';
import * as _ from 'lodash';
import { getNpmVersion, execute } from './helpers';
import chalk from 'chalk';

type LibType = "angular-lib" | "isomorphic-lib";

export const scripts = {
    release: execute('release.sh'),
    build: execute('build.sh', {
        'DIST_INDEX': path.join(__dirname, '../configs', 'index-dist.d.ts')
    }),
    version: () => {
        console.log(getNpmVersion())
    },
    new: (argv: string[]) => {
        if (!_.isArray(argv) || argv.length < 2) {
            console.log(chalk.red(`Top few argument for ${chalk.black('init')} parameter.`));
            console.log(chalk.red(`Examples:`));
            console.log(chalk.red(`\t${chalk.gray('tnp new angular-lib mySuperLib')}.`));
            console.log(chalk.red(`\t${chalk.gray('tnp new isomorphic-lib mySuperLib')}.`));
            process.exit(1);
        }
        const project = {
            type: argv[0] as LibType,
            name: argv[1]
        }
        if (project.type === 'angular-lib') {

        } else if (project.type === 'isomorphic-lib') {

        } else {
            console.log(chalk.red(`Bad library library type. Examples:`));
            console.log(chalk.red(`\t${chalk.gray('tnp new')} ${chalk.black('angular-lib')} ${chalk.gray('mySuperLib')}`));
            console.log(chalk.red(`\t${chalk.gray('tnp new')} ${chalk.black('isomorphic-lib')} ${chalk.gray('mySuperLib')}`));
        }

    }
}
