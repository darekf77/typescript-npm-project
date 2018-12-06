//#region @backend
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as child from 'child_process';
import axios from 'axios';
import { EntityRepository, META, ModelDataConfig } from "morphi";
import { TNP_PROJECT, SelfUpdate } from "../entities/TNP_PROJECT";

export interface TNP_PROJECT_ALIASES {
  project: string;
  projects: string;
}

@EntityRepository(TNP_PROJECT)
export class TNP_PROJECT_REPOSITORY extends META.BASE_REPOSITORY<TNP_PROJECT, TNP_PROJECT_ALIASES> {
  globalAliases: (keyof TNP_PROJECT_ALIASES)[] = ['project', 'projects']


}


//#endregion
