
//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as os from "os";
import * as rimraf from 'rimraf';

import { error, log } from "./helpers-messages";
import { run } from "./helpers-process";


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
      if (!fse.existsSync(filePath)) {
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

  export function createSymLink(existedFileOrFolder: string, destinationPath: string) {
    // console.log('Create link!')

    let target = existedFileOrFolder;
    let link = destinationPath;

    if (!fse.existsSync(existedFileOrFolder)) {
      error(`[helpers.createLink] target path doesn't exist: ${existedFileOrFolder}`)
    }

    if (link === '.' || link === './') {
      link = process.cwd()
    }

    if (!path.isAbsolute(link)) {
      link = path.join(process.cwd(), link);
    }

    if (!path.isAbsolute(target)) {
      target = path.join(process.cwd(), target);
    }

    if (link.endsWith('/')) {
      link = path.join(link, path.basename(target))
    }

    if (!fse.existsSync(path.dirname(link))) {
      fse.mkdirpSync(path.dirname(link))
    }


    rimraf.sync(link);
    log(`target ${target}`)
    log(`link ${link}`)
    fse.symlinkSync(target, link)
  }


  // return run(Helpers.createLink(target, link)).sync()
}


//#endregion
