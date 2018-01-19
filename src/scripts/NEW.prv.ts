
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

function newProject(type: LibType, name: string) {

    const project = Project.by(type);
    const destinationPath = getDestinationPath(name);
    if (type === 'angular-lib' || type === 'isomorphic-lib') {
        try {
            project.cloneTo(destinationPath);
            info(`Project ${project.name} create sucessfullu`);
        } catch (err) {
            error(err);
        }
    } else {
        error(`Bad library library type. Examples:`, true);
        error(`\t${chalk.gray('tnp new')} ${chalk.black('angular-lib')} ${chalk.gray('mySuperLib')}`, true);
        error(chalk.red(`\t${chalk.gray('tnp new')} ${chalk.black('isomorphic-lib')} ${chalk.gray('mySuperLib')}`));
    }

}


function handleArgs(argv: string[]) {
    if (!_.isArray(argv) || argv.length < 2) {
        error(`Top few argument for ${chalk.black('init')} parameter.`, true);
        error(`Examples:`, true);
        error(`\t${chalk.gray('tnp new angular-lib mySuperLib')}.`, true);
        error(`\t${chalk.gray('tnp new isomorphic-lib mySuperLib')}.`);
    }
    newProject(argv[0] as any, argv[1]);
}


export default {
    $NEW:  handleArgs
}
