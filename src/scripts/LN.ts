import * as os from "os";
import { run } from "../process";
import { error } from "../messages";
import * as path from "path";
import * as child from "child_process";

function $LN(argsString: string) {
    const args = argsString.split(' ');
    // console.log(args)
    if (!Array.isArray(args) || args.length < 2) {
        error(`To few arguments for linking function...`);
    }
    const link = args[0]
    let command: string;
    let target = args[1]
    if (os.platform() === 'win32') {
        if (target === '.' || target === './') {
            target = path.win32.normalize(path.join(process.cwd(), path.basename(link)))
        }
        command = "mklink \/D "
            + path.win32.normalize(target)
            + " "
            + path.win32.normalize(link)
            + " >nul 2>&1 "
        // console.log(command)
    } else {
        command = `ln -sf "${link}" "${target}"`;
    }
    run(command).sync()
    process.exit(0)
}

export default {
    $LN
}
