import { Models } from "tnp-models/src";
import { argsToClear } from "../../../constants";
import { config } from "tnp-config/src";
import { Project } from "./project";
import { Helpers } from "tnp-helpers/src";

export abstract class ElectronProject {


  async serverElectron(this: Project, args: string) {
    let {
      websql
    }: Models.dev.InitArgOptions = require('minimist')(args.split(' '));
    args = Helpers.cliTool.removeArgFromString(args, argsToClear);
    const elecProj = Project.From(this.pathFor([`tmp-apps-for-${config.folder.dist}${websql ? '-websql' : ''}`, this.name]));
    Helpers.info('Starting electron...')
    elecProj.run(`npm-run  electron . --serve ${websql ? '--websql' : ''}`).async();
  }


  async buildElectron(this: Project, outDir: Models.dev.BuildDir = 'dist', args: string) {
    let {
      websql
    }: Models.dev.InitArgOptions = require('minimist')(args.split(' '));
    args = Helpers.cliTool.removeArgFromString(args, argsToClear);
    const elecProj = Project.From(this.pathFor([`tmp-apps-for-${outDir}${websql ? '-websql' : ''}`, this.name]));
    elecProj.run(`npm-run electron-builder build --publish=never`).async();
  }


}
