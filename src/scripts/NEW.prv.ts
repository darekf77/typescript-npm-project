
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from "fs-extra";

import {
    run,
} from '../helpers';
import { prevent } from "../prevent";

import config from "../config";
import { LibType } from '../models';


function newProject(type: LibType, name: string) {

    const options: fse.CopyOptions = {
        overwrite: true,
        recursive: true,
        errorOnExist: true
    };
    const sourcePath = config.pathes.newProjectPrototypePath(type);
    const destinationPath = config.pathes.newProjectDestination(name);
    if (type === 'angular-lib' || type === 'isomorphic-lib') {
        try {
            fse.copySync(sourcePath, destinationPath, options);
            console.log(chalk.green(`${name.toUpperCase()} library structure created sucessfully, installing npm...`));
            run('npm i', { projectDirPath: destinationPath }).sync();
            console.log(chalk.green('Done.'));
        } catch (error) {
            console.log(chalk.red(error));
            process.exit(1)
        }
    } else {
        console.log(chalk.red(`Bad library library type. Examples:`));
        console.log(chalk.red(`\t${chalk.gray('tnp new')} ${chalk.black('angular-lib')} ${chalk.gray('mySuperLib')}`));
        console.log(chalk.red(`\t${chalk.gray('tnp new')} ${chalk.black('isomorphic-lib')} ${chalk.gray('mySuperLib')}`));
    }

}


function handleArgs(argv: string[]) {
    if (!_.isArray(argv) || argv.length < 2) {
        console.log(chalk.red(`Top few argument for ${chalk.black('init')} parameter.`));
        console.log(chalk.red(`Examples:`));
        console.log(chalk.red(`\t${chalk.gray('tnp new angular-lib mySuperLib')}.`));
        console.log(chalk.red(`\t${chalk.gray('tnp new isomorphic-lib mySuperLib')}.`));
        process.exit(1);
    }
    newProject(argv[0] as any, argv[1]);
}


export default {
    $NEW: handleArgs
}
