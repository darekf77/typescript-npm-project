
//#region @backend
import * as _ from 'lodash';
import { Project, BaseProjectLib, ProjectFrom } from '../project';
import { error, info } from '../messages';
import chalk from 'chalk';


export default {
  $DISCOVER(args) {
    Project.Current.checker.discoverExistedProjects()
    process.exit(0)
  }
}

//#endregion
