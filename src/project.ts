
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as os from 'os';
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';
import { buildIsomorphicVersion } from "morphi";
import { ChildProcess } from "child_process";


import { PackageJSON } from "./package-json";
import { LibType, BuildOptions, RecreateFile, Dependencies, BuildDir, RunOptions, RuleDependency } from "./models";
import { error, info, warn } from "./messages";
import config from "./config";
import { run as __run, watcher as __watcher, questionYesNo, compilationWrapper } from "./process";
import { create } from 'domain';
import { copyFile, deleteFiles, copyFiles, getWebpackEnv, ReorganizeArray, ClassHelper } from "./helpers";
import { HelpersLinks } from "./helpers-links";
import { ProjectRouter } from './router';



//#region Isomorphic lib


//#endregion


//#region Docker

//#endregion






//#region Angular Lib

//#endregion


//#region Angular Client

//#endregion


//#region AngularCliClient

//#endregion


//#region Ionic Client

//#endregion