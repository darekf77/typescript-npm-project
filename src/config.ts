import * as path from 'path';
import chalk from 'chalk';

export type LibType = "angular-lib" | "isomorphic-lib";

export const config = {
    lib: {
        sourcePath(libraryType: LibType) {
            if (libraryType === 'angular-lib') return path.join(__dirname, '../projects/angular-lib');
            if (libraryType === 'isomorphic-lib') return path.join(__dirname, '../projects/isomorphic-lib');
            console.error(chalk.red(`Bad library type: ${libraryType}`))
            process.exit(1);
        }
    }
}
