//#region @backend
import * as _ from 'lodash';
import { Project, BaseProjectLib, ProjectFrom } from '../project';
import { error, info } from '../messages';
import chalk from 'chalk';

function copy(destLocaiton) {

  const currentLib = (Project.Current as BaseProjectLib);
  const destination = ProjectFrom(destLocaiton);
  if (!destination) {
    error(`Incorect project in: ${destLocaiton}`)
  }
  currentLib.copytToManager.copyToProjectNodeModules(destination);
  info(`Project "${chalk.bold(currentLib.name)}" successfully installed in "${destination.name}"`);
}

function copyto(args: string) {

  const destLocaitons = args.split(' ').filter(a => a.trim() !== '');

  destLocaitons.forEach(c => copy(c));


  process.exit(0)
}


export default {
  $copytoproject: (args) => {
    copyto(args)
  },
  $copy_to_project: (args) => {
    copyto(args)
  }
}
//#endregion
