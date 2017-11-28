import * as child from 'child_process'
import * as fs from 'fs';
import * as path from 'path';

export enum Strategy {
    BUILD,
    PUBLISH,
    CLEAN
}

let strategy: Strategy = Strategy.BUILD;
if (process.argv.filter(a => a === '--publish').length > 0) strategy = Strategy.PUBLISH;
if (process.argv.filter(a => a === '--clean').length > 0) strategy = Strategy.CLEAN;

function deleteGenerated() {
    child.execSync(`bash ${path.join(__dirname, 'scripts', 'delete_generated_files.sh')}`
        , { cwd: process.cwd(), stdio: [0, 1, 2] })
}

function buildJavascriptSourceMapDfiles() {
    child.execSync(`bash ${path.join(__dirname, 'scripts', 'build.sh')}`
        , { cwd: process.cwd(), stdio: [0, 1, 2] })
}

function publishToNPM() {
    child.execSync(`bash ${path.join(__dirname, 'scripts', 'publish.sh')}`
        , { cwd: process.cwd(), stdio: [0, 1, 2] })
}


switch (strategy) {
    case Strategy.BUILD:
        deleteGenerated();
        buildJavascriptSourceMapDfiles();
        break;
    case Strategy.PUBLISH:
        deleteGenerated();
        buildJavascriptSourceMapDfiles();
        publishToNPM();
        deleteGenerated();
        break;
    case Strategy.CLEAN:
        deleteGenerated();
        break;
}


