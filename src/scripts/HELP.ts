//#region @backend
import * as _ from 'lodash';
import * as fs from 'fs';
import glob = require('glob')
import * as path from 'path';
import { paramsFrom, match } from '../helpers';
import chalk from 'chalk';
import { clearConsole } from "../process";
import { error } from '../messages';

const generalHelp = `

To use help run:
tnp help <command name>

`

export function getHelpFor(command: string, warnings = false) {
    let docs;
    glob.sync(path.join(__dirname, '/*.js'))
        .find((file) => {
            let exportetFunctions: Object = require(path.resolve(file)).default;
            let groupHelp: { title: string, content: string }[] = [];
            let commandNameFit = false;
            const result = !!(_.isObject(exportetFunctions) && Object.keys(exportetFunctions).find(k => {
                console.log('k', k)
                const v = exportetFunctions[k];
                if (typeof v === 'string') {
                    groupHelp.push({ title: k, content: v });
                }
                if (warnings && typeof v === 'function') {
                    const tsFile = file.replace(path.basename(file), path.basename(file).replace('.js', '.ts'));
                    console.log(`WARN: No documentation for: ${v.name}  in ${tsFile.replace('dist', 'src')} `)
                }
                if (paramsFrom(k) === paramsFrom(command)) {
                    commandNameFit = true;
                }
                const res = Array.isArray(v) && v.length == 2 && _.isString(v[1]) && command !== undefined && paramsFrom(k) === paramsFrom(command);
                if (res) {
                    docs = v[1];
                }
                return res;
            }));
            if (!result && commandNameFit && !!groupHelp) {
                docs = groupHelp.map(gh => {
                    return `${gh.title}\n${gh.content}`;
                }).join('\n');
                return true;
            }
            return result;
        });
    return docs;
}




function help(argsString: string) {
    const args = argsString.trim().split(' ').filter(f => !!f);
    console.log(args)
    if (args.length === 0) {
        getHelpFor(undefined, true)
    } else if (args.length >= 2 && args[1] === '!') {
        getHelpFor('', true)
    } else if (args.length >= 1) {
        const command = args[0];
        const docs = getHelpFor(command);
        if (docs) {
            clearConsole()
            console.log(`\nHelp for command "${chalk.green(command)}":\n`)
            console.log(docs)
        } else {
            error(`No documentation for ${chalk.bold(command)}`)
        }
    }
    process.exit(0);
}

export default {
    $HELP: (args) => {
        help(args)
    },
    HELP: (args) => {
        help(args)
    }
}
//#endregion
