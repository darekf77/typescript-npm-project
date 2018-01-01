import * as child from 'child_process'
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

export function execute(scriptName: string) {
    return function () {
        const p = path.join(__dirname, '../scripts', scriptName);
        if (!fs.existsSync(p)) {
            console.log(chalk.red(`Undefined script "${p}"`));
            process.exit(1);
        }
        child.execSync(`bash ${p}`, { cwd: process.cwd(), stdio: [0, 1, 2] })
    }

}
