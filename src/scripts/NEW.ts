
//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';

import config from "../config";
import { LibType } from '../models';
import { run } from "../process";
import { Project } from "../project";
import { info, error } from "../messages";

function getDestinationPath(projectName: string) {
    if (path.isAbsolute(projectName)) return projectName;
    return path.join(process.cwd(), projectName);
}

function goodExamples() {
    console.log(chalk.green(`Good examples:`));
    config.libsTypes.forEach(t => {
        console.log(`\t${chalk.gray('tnp new')} ${chalk.black(t)} ${chalk.gray('mySuperLib')}`);
    })
    error(chalk.red(`Please use example above.`));
}

function newProject(type: LibType, name: string) {

    const project = Project.by(type);
    const destinationPath = getDestinationPath(name);
    if (project) {
        try {
            project.cloneTo(destinationPath);
            info(`Project ${project.name} create successfully`);
        } catch (err) {
            error(err);
        }
    } else {
        goodExamples()
    }
    process.exit(0)

}


function handleArgs(args: string) {
    const argv = args.split(' ');
    if (!_.isArray(argv) || argv.length < 2) {
        error(`Top few argument for ${chalk.black('init')} parameter.`, true);
        goodExamples()
    }
    newProject(argv[0] as any, argv[1]);
}


export default {
    $NEW: handleArgs
}
//#endregion
