
import { Project } from './base-project';

export type TestType = 'unit' | 'integration' | 'e2e';


export class TestRunner {

  constructor(private project: Project) {

  }
  //#region @backend
  start(type: TestType = 'unit') {
    let command: string;
    switch (this.project.type) {
      case 'isomorphic-lib':
        command = `npm-run mocha -r ts-node/register src/**/*.spec.ts`
        break;

      default:
        break;
    }
    if (!command) {
      throw `Tests not impolemented for ${this.project.type}`
    }
    this.project.run(command, { output: true }).sync()
  }


  async startAndWatch(type: TestType = 'unit') {
    let command: string;
    switch (this.project.type) {
      case 'isomorphic-lib':
        command = `npm-run mocha  -r ts-node/register --watch  src/**/*.spec.ts --watch-extensions ts`
        break;

      default:
        break;
    }
    if (!command) {
      throw `Tests not impolemented for ${this.project.type}`
    }
    this.project.run(command, { output: true }).sync()
  }
  //#endregion


}
