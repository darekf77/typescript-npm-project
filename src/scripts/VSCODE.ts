import { run } from '../helpers';

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
