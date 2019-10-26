import * as path from 'path';
import * as fse from 'fs-extra';
import { Project } from '../../project';
import { Helpers } from '../../helpers';

const githubProjects = [
  'firedev',
  'ng2-rest',
  'ng2-logger',
  'morphi',
  'ng2-rest-swagger-generator',
  'incremental-compiler',
  'typescript-class-helpers',
  'json10',
  'lodash-walk-object',
  'base-model-wrap',
  'ng2-rest-docs-server',
  'isomorphic-region-loader',
  'aurora',

  'static-columns',
  'bs4-breakpoint',
  'button-dropdown',
  'ng2-scroll-slider',
  'bs3-table',
  'ng4-storage',
  'ng2-button-loader',
  'edit-table',
  'ng2-tags',
  'ng2-preloader',
  'loading-info',
  'ng2-accordions',
  'bs3-breakpoint',


  'IonicCoffeescript',
  'angular2-example-http-login',
  'http-socket-proxy-router',
  'example-isomorphic-rest',
  'my-old-js-tests',
  'rebird-https-letsencrypt',
  'pdf-in-browser-angular-nodejs',


]


function $GITHUB_DUMP(args: string, exit = true) {
  const address = 'git@github.com:darekf77/';
  const npmLocation = path.resolve(path.join(Project.Tnp.location, '..'));
  for (let index = 0; index < githubProjects.length; index++) {
    const projectName = githubProjects[index];
    const githubGitUrl = `${address}${projectName}`;
    try {
      const dest = path.join(npmLocation, projectName);
      if (fse.existsSync(dest)) {
        Project.From(dest).git.pullCurrentBranch();
      } else {
        Helpers.run(`git clone ${githubGitUrl}`, { cwd: npmLocation }).sync();
      }
    } catch (err) {
      console.log(err);
    }
  }
  if(exit) {
    process.exit(0)
  }
}

export default {
  $GITHUB_DUMP
}
