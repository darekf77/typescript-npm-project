
import * as fs from 'fs';
import { error, info } from "./messages";


export function copy(sousrce: string, destination: string) {
    if (!fs.existsSync(sousrce)) {
        error(`[${copy.name}] No able to find source of ${sousrce}`);
    }
    fs.writeFileSync(this.path, fs.readFileSync(sousrce), 'utf8')
}


