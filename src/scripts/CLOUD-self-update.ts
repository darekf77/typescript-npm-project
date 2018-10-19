//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { Worker } from 'webworker-threads';


import * as express from "express";
import * as http from "http";
import * as  cors from 'cors';
import * as bodyParser from 'body-parser';
import * as errorHandler from 'errorhandler';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as fileUpload from 'express-fileupload';

import { ProjectFrom, Project } from '../project';
import { killProcessByPort, run } from '../process';
import { PROGRESS_BAR_DATA } from '../progress-output';
import { statSync } from 'fs-extra';
import { err } from '../project/environment-config-helpers';
import { paramsFrom } from '../helpers';
import { CloudHelpers } from './CLOUD-helpers';






const status = {
  progress: new PROGRESS_BAR_DATA(),
  child: undefined as string,
  operation: 'starting' as 'starting' |
    'error - wrong project' |
    'error - environment should be "online"' |
    'creating backup - start' |
    'creating backup - error' |
    'creating backup - complete' |
    'build process ended' |
    'restoring and building backup - start' |
    'restoring and building backup - error' |
    'restoring and building backup - complete (starting cloud as deamon)' |
    'restored application running in progress ' |
    'complete - starting cloud',
  operationErrors: [] as string[]
}


function expressApp(port: number) {
  const app = express()
  app.use(fileUpload())
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(cors());

  app.get('/status', (req, res) => {
    res.json(status);
  })

  const h = new http.Server(app);
  h.listen(port, () => {
    console.log(`Cloud safe rebuild is running on port ${port}`)
  })
}


function backupCloud(project: Project, workspace: Project) {
  status.operation = 'creating backup - start';

  const cwd = path.resolve(path.join(project.location,
    (project === workspace) ? '..' : '../..'
  ));
  console.log('cwd', cwd)
  try {
    run(`rimraf ${project.backupName}`, { cwd }).sync()
    run(`cp -R ${project.name} ${project.backupName}`, { cwd }).sync()
    status.operation = 'creating backup - complete';
  } catch (error) {
    status.operation = 'creating backup - error';
    status.operationErrors.push(JSON.stringify(error));
  }
}

function resotreBuildAndRunCloud(project: Project) {
  status.operation = 'restoring and building backup - start'

  const cwd = path.resolve(path.join(project.location, '..'));
  try {
    run(`rimraf ${project.name}`, { cwd }).sync()
    run(`mv ${project.backupName} ${project.name}`, { cwd }).sync()
    CloudHelpers.cloudStartNoOutput()
    status.operation = 'restoring and building backup - complete (starting cloud as deamon)'
  } catch (error) {
    status.operation = 'restoring and building backup - error'
    status.operationErrors.push(JSON.stringify(error));
  }
}

function setStatusDefault() {
  status.progress = new PROGRESS_BAR_DATA();
  status.operation = 'starting';
  status.operationErrors = [];
}

function resolveProject(args) {
  let { child }: { child: string; } = require('minimist')(args.split(' '));
  child = (_.isString(child) ? child.trim() : child)

  let project = CloudHelpers.cloudProject();
  const workspace = project;

  // project.clear()
  // project.run(`tnp init --env=online`).sync()

  const port = project.env.config.cloud.ports.update;
  killProcessByPort(port);
  expressApp(port);


  if (_.isString(child)) {
    project = project.children.find(p => p.name === child)
  }

  if (!project) {
    status.operation = 'error - wrong project'
    status.operationErrors.push(`Bad child name ${child} to build project`);
    process.stdin.resume()
  }
  return { project, workspace };
}

function selfUpdate(project: Project, restoreFnOnError: () => void) {

  project.git.resetHard()
  project.git.updateOrigin()

  let p = project.run(`tnp build`, { biggerBuffer: true }).async()

  p.stdout.on('data', chunk => {
    PROGRESS_BAR_DATA.resolveFrom(chunk.toString(), progress => {
      status.progress = progress;
    })
    if (status.progress.status === 'complete') {
      status.operation = 'complete - starting cloud';
      CloudHelpers.cloudStartNoOutput()
    }
  })

  // p.stderr.on('data', err => {
  //   status.operationErrors.push(`stderr data:
  //   ${err.toString()}
  //   `)
  // })

  p.stderr.on('error', err => {
    status.operationErrors.push(`stderr error:

    ${JSON.stringify(err)}

    `)
  })

  p.stdout.on('error', (err) => {
    status.operationErrors.push(`stdout error:

    ${JSON.stringify(err)}

    `)
    status.progress.status = 'error';
    status.progress.info = JSON.stringify(err);
    restoreFnOnError()
  })

  p.stdout.once('end', () => {
    console.log('BUILD PROCESS ENDED')
    status.operation = 'build process ended';
    // setTimeout(() => { /// TODO is this good thing ?
    //   p.removeAllListeners()
    // }, 1000)
  })

}

export function $CLOUD_SELF_REBUILD_AND_RUN(args = '') {

  setStatusDefault()

  const { project, workspace } = resolveProject(args);

  backupCloud(project, workspace);

  if (project.env.config.name !== 'local') {
    selfUpdate(project, () => {
      resotreBuildAndRunCloud(project);
    });
  }

}


//#endregion
