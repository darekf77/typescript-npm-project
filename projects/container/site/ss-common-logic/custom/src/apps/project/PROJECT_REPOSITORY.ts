//#region @backend
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as child from 'child_process';
import axios from 'axios';
import { Morphi } from "morphi";
import { PROJECT } from "./PROJECT";

export interface TNP_PROJECT_ALIASES {
  project: string;
  projects: string;
}

@Morphi.Repository(PROJECT)
export class PROJECT_REPOSITORY extends Morphi.Base.Repository<PROJECT, TNP_PROJECT_ALIASES> {
  globalAliases: (keyof TNP_PROJECT_ALIASES)[] = ['project', 'projects']


}


//#endregion
