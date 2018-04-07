import * as fs from 'fs';
import * as path from 'path';
// local
import { Project } from "./base-project";
import { LibType, RecreateFile } from "../models";
import { copyFile } from '../helpers';


export class FilesRecreator {

    constructor(private project: Project) { }

    npmignore() {
        const allowedProject: LibType[] = ['isomorphic-lib', 'angular-lib']
        const canBeUseAsNpmPackage = allowedProject.includes(this.project.type);
        const npmignoreFiles = [
            ".vscode",
            "dist/",
            'src/',
            "/scripts",
            "/docs",
            "/preview",
            '/tests',
            "tsconfig.json",
            "npm-debug.log*"
        ];
        fs.writeFileSync(path.join(this.project.location, '.npmignore'),
            npmignoreFiles.join('\n'), 'utf8');
    }

    gitignore() {

        const gitignoreFiles = [ // for sure ingored
            '/node_modules',
            '/tmp*',
            '/dist*',
            '/bundle*',
            '/browser',
            '/module',
            '/www',
            'bundle.umd.js'
        ].concat([ // common small files
            'Thumbs.db',
            '.DS_Store',
            'npm-debug.log'
        ].concat([ // not sure if ignored/needed
            '/.sass-cache',
            '/.sourcemaps'
        ]).concat( // for site ignore auto-generate scr 
            this.project.isSite ? ['/src'] : []
        ))
        fs.writeFileSync(path.join(this.project.location, '.gitignore'),
            gitignoreFiles.join('\n'), 'utf8');
    }

    projectSpecyficFiles() {
        const defaultProjectProptotype = Project.by(this.project.type);
        let files: RecreateFile[] = [];
        if (this.project.location !== defaultProjectProptotype.location) {
            this.project.projectSpecyficFiles().forEach(f => {
                files.push({
                    from: path.join(defaultProjectProptotype.location, f),
                    where: path.join(this.project.location, f)
                })
            })
            files.forEach(file => {
                copyFile(file.from, file.where)
            })
        }
    }

    commonFiles() {
        const wokrspace = Project.by('workspace');
        let files = [
            // '.npmrc',
            'tslint.json',
            '.editorconfig'
        ];
        files.map(file => {
            return {
                from: path.join(wokrspace.location, file),
                where: path.join(this.project.location, file)
            }
        }).forEach(file => {
            copyFile(file.from, file.where)
        })
    }


}