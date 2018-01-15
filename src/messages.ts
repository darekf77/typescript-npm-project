import chalk from 'chalk';
export function error(details: any, noExit = false) {
    if (typeof details === 'object') {
        console.log(chalk.red(JSON.stringify(details)));
    } else {
        console.log(chalk.red(details));
    }

    if (!noExit) {
        process.exit(1);
    }
}

export function info(details: string) {
    console.log(chalk.green(details))
}

export function warn(details: string) {
    console.log(chalk.yellow(details))
}
