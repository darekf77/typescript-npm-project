import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import { clear } from "./scripts/CLEAR";

import { LibType, TemplateFile, RecreateFile, BuildType } from './models';
import { error } from "./messages";

const config = {
    folder: {
        watchDist: 'dist/',
        bundle: 'bundle/',
        preview(libType:LibType) {
            return path.join(this.location, 'preview');
        }
    },

    beforeBuikd(buildType: BuildType) {

        return {
            fileToRecreateFor(libType: LibType): RecreateFile[] {
                const wokrspace = config.pathes.newProjectPrototypePath(libType);
                const files = [];
                if (libType === 'isomorphic-lib') {
                    files.push('src/client.ts')
                }
                return files.map(file => path.join(wokrspace, file))
                    .map(file => {
                        return { from: path.join(wokrspace, file), where: path.join(process.cwd(), file) }
                    })
                    .concat(config.beforeBuikd(buildType)._commonFiles())
            },

            _commonFiles(): RecreateFile[] {
                const wokrspace = config.pathes.newProjectPrototypePath('workspace');
                const files = [
                    'index.js',
                    'index.d.ts',
                    'index.js.map',
                    '.npmrc',
                    '.gitignore',
                    '.npmignore',
                    'tslint.json'
                ];
                return files.map(file => {
                    return { from: path.join(wokrspace, file), where: path.join(process.cwd(), file) }
                })
            }
        }
    },

    afterBuild(buildType: BuildType) {
        return {
            filesToRecreateFor(libType: LibType): RecreateFile[] {
                const files: RecreateFile[] = [];
                if (libType === 'isomorphic-lib') {
                    const f = ['client.d.ts', 'client.js', 'client.js.map']
                    f.forEach(file => {
                        files.push({
                            where: path.join(process.cwd(), file),
                            from: path.join(process.cwd(), config.folder.watchDist, file),
                        })
                    })
                }
                return files;
            }
        }
    },

    pathes: {
        releaseItJSON(prod = false) {
            const releseFile = prod ? 'release-it-prod.json' : 'release-it.json';
            return path.join(__dirname, '..', releseFile);
        },
        newProjectDestination(projectName: string) {
            if (path.isAbsolute(projectName)) return projectName;
            return path.join(process.cwd(), projectName);
        },
        newProjectPrototypePath(libraryType: LibType) {
            if (libraryType === 'workspace') {
                return path.join(__dirname, `../projects`);
            }
            const p = path.join(__dirname, `../projects/${libraryType}`);
            if (!fs.existsSync(p)) {
                error(`Bad library type: ${libraryType}`)
            }
        }
    },

    webpack: {
        paramsFor(libType: LibType, prod = false, watch = false) {
            const o = {
                env: [
                    '--env.production=' + prod,
                    '--env.isWatch=' + watch
                ],
                config: '--config=' + path.join(__dirname, '/webpack-config/angular-lib.' + (prod ? 'prod.' : '') + 'js'),
                watch: watch ? '--watch' : '',

            }
            return `${o.config} ${o.watch}  --bail ${o.env.join(' ')}`;
        },
        params(prod = false, watch = false) {
            const o = {
                env: [
                    '--env.production=' + prod,
                    '--env.isWatch=' + watch
                ],
                config: '--config=' + path.join(__dirname, '/webpack-config/isomorphic-lib.' + (prod ? 'prod.' : '') + 'js'),
                watch: watch ? '--watch' : '',

            }
            return `${o.config} ${o.watch}  --bail ${o.env.join(' ')}`;
        }
    }


}


export default config;
