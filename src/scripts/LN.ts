import * as os from "os";
import { run } from "../process";
import { error } from "../messages";
import { HelpersLinks } from "../helpers-links";
import * as path from "path";
import * as child from "child_process";

function $LN(argsString: string) {
    const args = argsString.split(' ');
    // console.log(args)
    if (!Array.isArray(args) || args.length < 2) {
        error(`To few arguments for linking function...`);
    }
    const link = args[0]
    let target = args[1]
    try {
        HelpersLinks.createLink(target, link)
    } catch (e) {
        console.log(e)
        error(`Not able to craate link from: "${link}" to target: "${target}".`, true)
    }
    process.exit(0)
}

export default {
    $LN
}
