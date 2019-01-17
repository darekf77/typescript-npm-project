
//#region @backend
import * as _ from 'lodash';
import { Project, BaseProjectLib, ProjectFrom } from '../project';
import { error, info } from '../messages';
import chalk from 'chalk';
import { TnpDB } from '../tnp-db';


export default {
  $DISCOVER: async (args) => {
    const db = await TnpDB.Instance
    db.projects.discoverExistedProjects()
    process.exit(0)
  }
}

//#endregion
