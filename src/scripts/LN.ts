import { HelpersLinks } from '../helpers';

//#region @backend

export default {
  LN(args: string) {
    let [target, link] = args.split(' ');
    HelpersLinks.createSymLink(target, link)
    process.exit(0)
  }
}

//#endregion
