
import * as fs from 'fs';
import * as path from 'path';

export function getNpmVersion(): string {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8').toString()).version
}   