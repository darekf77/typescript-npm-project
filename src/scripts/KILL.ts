
import { info, error } from "../messages";
import { run, killProcessByPort } from '../process';
import * as os from 'os';

function killall() {
  run(`fkill -f node`).sync()
  // if (process.platform === 'win32') {
  //   run(`taskkill /F /im node.exe`).sync();
  // } else {
  //   run(`killall -9 node`).sync();
  // }
}



export function killonport(args, noExit = false) {
  const port = parseInt(args.trim())
  killProcessByPort(port);
  if (!noExit) {
    process.exit(0)
  }
}


export default {
  $KILL_ON_PORT: (args: string) => {
    killonport(args);
  },
  $KILLONPORT: (args: string) => {
    killonport(args);
  },
  $KILLALL_NODE: () => {
    killall()
  },
  $KILLALLNODE: () => {
    killall()
  }

}
