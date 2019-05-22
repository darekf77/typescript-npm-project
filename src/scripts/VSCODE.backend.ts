import { run } from '../helpers';
import * as path from 'path';
import config from '../config';

const projectsTnp = [
  "/Users/dfilipiak/projects/npm/tsc-npm-project",
  "/Users/dfilipiak/projects/npm/tsc-npm-project/projects/container/baseline",
  "/Users/dfilipiak/projects/npm/tsc-npm-project/projects/container/site",
  "/Users/dfilipiak/projects/npm/morphi",
];

const projectsIgt = [
  "/Users/dfilipiak/projects/igt/cas-ui",
  "/Users/dfilipiak/projects/igt/cas-ui/external/CAS-es-rs-ui",
]

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
