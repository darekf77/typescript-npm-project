import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as child from "child_process";
import * as fse from "fs-extra";

import {
    execute, project, run, error,
    preventNonInstalledNodeModules,
    copyResourcesToBundle
} from './helpers';
import { config } from "./config";
import { LibType } from './models';



export const scripts = {
    release: () => {
        run(`release-it -c ${path.join(__dirname, "../release-it.json")}`)
    },
    build_watch: () => {
        // preventNonInstalledNodeModules();
        if (project.current.getType() === 'isomorphic-lib') {
            run('npm-run tsc -w')
        } else if (project.current.getType() === 'angular-lib') {
            run('npm-run ng server')
        }
    },
    build: () => {
        preventNonInstalledNodeModules();
        if (project.current.getType() === 'isomorphic-lib') {
            scripts.clear();
            const configPath = path.join(__dirname, '../configs/webpack.config.isomorphic-client.js');
            run(`npm-run webpack --config=${configPath}`)
            copyResourcesToBundle();
        }
    },
    clear: () => {
        run('rimraf bundle/ && rimraf client.js')
    },
    version: () => {
        console.log(project.tnp.version());
    },
    //#region new
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
        const options: fse.CopyOptions = {
            overwrite: true,
            recursive: true,
            errorOnExist: true
        };
        const sourcePath = config.lib.sourcePath(project.type);
        const destinationPath = path.join(process.cwd(), project.name);
        if (project.type === 'angular-lib' || project.type === 'isomorphic-lib') {
            try {
                fse.copySync(sourcePath, destinationPath, options);
                console.log(chalk.green(`${project.name.toUpperCase()} library structure created sucessfully, installing npm...`));
                child.execSync(`cd ${destinationPath} && npm i`);
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
    //#endregion
}
