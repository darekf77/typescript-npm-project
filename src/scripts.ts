import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as child from "child_process";
import * as fse from "fs-extra";

import {
    execute, project, run, error, prevent,
    copyResourcesToBundle,
    getProjectsInFolder
} from './helpers';
import { config } from "./config";
import { LibType } from './models';


export const scripts = {
    release: (prod = false) => {
        // scripts.clear();
        // copyResourcesToBundle();
        const releseFile = prod ? 'release-it-prod.json' : 'release-it.json';
        run(`release-it -c ${path.join(__dirname, '..', releseFile)}`).sync.inProject()
    },
    build_watch: (projectType: LibType = project.current.getType(), projectDir: string = process.cwd(), runAsync = false) => {
        prevent.notInstalled.nodeModules();
        let command;
        if (projectType === 'isomorphic-lib' || projectType === 'nodejs-server') {
            command = 'npm-run tsc -w';
        } else if (projectType === 'angular-lib' ) {
            command = 'npm-run ng serve';
        } else if (projectType === 'angular-client') {
            command = 'npm-run webpack-dev-server --port=4200';
        } else if (projectType === 'workspace') {
            getProjectsInFolder(process.cwd()).forEach(d => {
                scripts.build_watch(d.type, d.path, true);
            })
            return;
        }
        if (runAsync) run(command).async.inProject(projectDir)
        else run(command).sync.inProject(projectDir)
    },
    build: (prod = false) => {
        prevent.notInstalled.nodeModules();
        prevent.notInstalled.tnpDevDependencies();
        if (project.current.getType() === 'isomorphic-lib') {
            scripts.clear();
            const configPath = path.join(
                __dirname,
                '../configs/webpack.config.isomorphic-client.' +
                (prod ? 'prod.' : '') + 'js');
            run(`npm-run webpack --config=${configPath}`).sync.inProject()
        }
    },
    clear: () => {
        run('rimraf bundle/ && rimraf client.js').sync.inProject();
    },
    clear_all: () => {
        run('rimraf node_modules/ && rimraf bundle/ && rimraf client.js').sync.inProject();
    },
    copy_resources: () => {
        copyResourcesToBundle();
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
