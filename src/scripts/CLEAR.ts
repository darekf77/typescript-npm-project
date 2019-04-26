//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import { LibType, BuildDir } from '../models';

import { Project } from '../project';
import { clearConsole } from '../helpers';
import config from '../config';
import { TnpDB } from '../tnp-db';



export default {
  $CLEAN: async (args) => { await clear(args) },
  $CLEAR: async (args) => { await clear(args) },
  $CLEAN_ALL: async () => { await clear('', true) },
  $CLEAR_ALL: async () => { await clear('', true) }
}
//#endregion
