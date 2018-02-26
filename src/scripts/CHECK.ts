
import { HelpersLinks } from "../helpers-links";
import { error, info } from "../messages";
import chalk from "chalk";
import * as path from "path";

function checkSymlink(args: string) {
    if (!args) {
        error(`No folder name to check, try ${chalk.green('tnp check:symlink <folder_path>')}`)
    }
    let folder = args;
    if (!path.isAbsolute(folder)) {
        folder = path.join(process.cwd(), folder)
    }
    folder = path.resolve(folder);
    // console.log('FOLDER:', folder)
    if (HelpersLinks.isLink(folder)) {
        info(`This is link: ${folder}`)
        process.exit(0)
    }
    info(`This isn't link: ${folder}`)
    process.exit(1)
}

export default {
    $CHECK_SYMLINK: (args) => checkSymlink(args)
}
