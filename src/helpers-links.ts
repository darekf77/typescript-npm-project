
import * as _ from 'lodash'
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from "rimraf";
import * as glob from "glob";
import * as os from "os";

import { error, info, warn } from "./messages";
import { run } from "./process";
import { constants } from 'zlib';
import { BuildOptions, RuleDependency } from './models';
import { Project } from './project';
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
        return run(Helpers.createLink(target, link)).sync()
    }

}