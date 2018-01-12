import chalk from 'chalk';
export function error(details: string) {
    console.log(chalk.red(details));
    process.exit(1);
}
