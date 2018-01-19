
import * as fs from 'fs';
import * as path from 'path';
import { error, info, warn } from "./messages";


export function copy(sousrce: string, destination: string) {
    if (!fs.existsSync(sousrce)) {
        warn(`[${copy.name}] No able to find source of ${sousrce}`);
        return;
    }
    if (sousrce === destination) {
        warn(`Trying to copy same file ${sousrce}`);
        return;
    }
    // console.log(`Copy from ${sousrce.slice(-20)} to ${destination.slice(-20)}`)
    fs.writeFileSync(destination, fs.readFileSync(sousrce), 'utf8')
}


