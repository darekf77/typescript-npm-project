//#region @backend
import * as _ from 'lodash';
import { Project, BaseProjectLib, ProjectFrom } from '../project';
import { error, info } from '../messages';
import chalk from 'chalk';

function copyto(args: string) {
  const currentLib = (Project.Current as BaseProjectLib);
  const destLocaiton = _.first(args.split(' ').filter(a => a.trim() !== ''));
  const destination = ProjectFrom(destLocaiton);
  if (!destination) {
    error(`Incorect project in: ${destLocaiton}`)
  }
  currentLib.copytToManager.copyToProjectNodeModules(destination);
  info(`Current project "${chalk.bold(currentLib.name)}" successfully installed in "${destination.name}"`);
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
