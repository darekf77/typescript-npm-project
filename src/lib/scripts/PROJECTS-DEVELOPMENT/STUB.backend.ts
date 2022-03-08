import { _ } from 'tnp-core';
import { fse } from 'tnp-core'
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import { config } from 'tnp-config';
import { TnpDB } from 'tnp-db';
import { notify } from 'node-notifier';
import { CLASS } from 'typescript-class-helpers';
import chalk from 'chalk';

function $stub(args: string) {
  const proj = Project.Current as Project;
  // proj.node_modules.stuberizeFrontendPackages(args.split(' ').filter(f => !!f));
  // console.log(files);
  process.exit(0)
}

function $stuberize(args: string) {
  $stub(args);
}



export default {
  $stub: Helpers.CLIWRAP($stub, '$stub'),
  $stuberize: Helpers.CLIWRAP($stuberize, '$stuberize'),
}
