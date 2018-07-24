import { run } from '../process';
import * as _ from "lodash";

export default {
  $MV: (argsString:string) => {
    const args = argsString.split(' ')
    const from = args[0]
    const to = args[1]
    const command = `renamer --find  ${from}  --replace  ${to} *`;
    // console.log(command)
    run(command).sync()
    process.exit(0)
  }
}
