import { run } from '../helpers';
import * as path from 'path';
import config from '../config';

export function VSCODE_EXT(exit = true) {
  run(`npm install && npm-run tsc && npm run build:install`, {
    cwd: config.pathes.tnp_vscode_ext_location,
    output: true
  }).sync()

  if (exit) {
    process.exit(0)
  }
}


export default {

  async PROJECT() {
    let command: string;
    if (process.platform === 'darwin') {
      command = `kill -9 $(pgrep "Code Helper") && kill -9 $(pgrep "Code")`;
    }
    // run(`kill§ `).sync()
    process.exit(0)
  }

}
