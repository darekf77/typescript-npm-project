import chalk from 'chalk';
export function error(details: string, noExit = false) {
    console.log(chalk.red(details));
    if (!noExit) process.exit(1);
}

export function info(details: string) {
    console.log(chalk.green(details))
}