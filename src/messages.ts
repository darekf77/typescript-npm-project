import chalk from 'chalk';
export function error(details: any, noExit = false) {
    if (typeof details === 'object') {
        try {
            const json = JSON.stringify(details)
            console.trace(chalk.red(json));
        } catch (error) {
            console.trace(details);
        }
    } else {
        console.trace(chalk.red(details));
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
