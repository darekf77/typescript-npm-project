
//#region @backend
import * as fs from 'fs';
import * as path from 'path';
import * as os from "os";

import { error} from "./helpers-messages";
import { run } from "./helpers-process";

import { Helpers } from "morphi";


export namespace HelpersLinks {



    export function removeSlashAtEnd(s: string) {
        s = s.endsWith(`/`) ? s.slice(0, s.length - 1) : s;
        return s;
    }

    export function isLink(filePath: string) {

        if (os.platform() === 'win32') {
            filePath = path.win32.normalize(filePath);
            // console.log('extename: ', path.extname(filePath))
            return path.extname(filePath) === '.lnk';
        } else {
            if (!fs.existsSync(filePath)) {
                error(`File or folder "${filePath}" doesn't exist.`)
            }
            try {
                filePath = removeSlashAtEnd(filePath);
                const command = `[[ -L "${filePath}" && -d "${filePath}" ]] && echo "symlink"`;
                // console.log(command)
                const res = run(command, { output: false }).sync().toString()
                return res.trim() === "symlink"
            } catch (error) {
                return false;
            }
        }
    }

    export function createLink(target, link) {
        // console.log('Create link!')
        return run(Helpers.createLink(target, link)).sync()
    }

}
//#endregion
