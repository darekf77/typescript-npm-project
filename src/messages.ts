import chalk from 'chalk';
export function error(details: any, noExit = false) {
    if (typeof details === 'object') {
        try {
            const json = JSON.stringify(details)
            console.log(chalk.red(json));
        } catch (error) {
            console.log(details);
        }       
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
