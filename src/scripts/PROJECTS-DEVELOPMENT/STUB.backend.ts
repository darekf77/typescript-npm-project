import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import * as path from 'path';
import * as glob from 'glob';
import { config } from 'tnp-config';
import { TnpDB } from 'tnp-db';
import * as chokidar from 'chokidar';
import { notify } from 'node-notifier';
import { CLASS } from 'typescript-class-helpers';
import chalk from 'chalk';

async function $stub(args: string) {
  const proj = Project.Current as Project;
  proj.node_modules.stuberizeFrontendPackages(args.split(' '));
  // console.log(files);
  process.exit(0)
}

export default {
  $stub: Helpers.CLIWRAP($stub, '$stub')
}
