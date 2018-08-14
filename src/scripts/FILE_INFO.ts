

import * as  fs from 'fs';
import * as  path from 'path';

import {  getMostRecentFilesNames } from '../helpers';



export default {

  $FILEINFO: (args) => {
    console.log(getMostRecentFilesNames(process.cwd()))

    process.exit(0)
  }

}
