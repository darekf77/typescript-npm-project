import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project, LibProject } from "../project";
import { error, info, HelpersLinks, killProcess, warn, escapeStringForRegEx } from '../helpers';
import chalk from 'chalk';
import { getMostRecentFilesNames } from '../helpers';
import { Helpers as HelpersMorphi } from "morphi";
import { run } from "../helpers";
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import { commitWhatIs } from '../helpers';
import { paramsFrom } from '../helpers';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { TnpDB } from '../tnp-db';

function killvscode(args: string, exit = true) {
  try {
    run(`kill -9 $(pgrep Electron)`).sync();
    info(`Killled`)
  } catch (error) {
    warn(`kill not needed`)
  }
  if (exit) {
    process.exit(0)
  }
}

export async function develop(args: string, exit = true) {
  // console.log('adasdas')
  const { kill = false } = require('minimist')(!args ? [] : args.split(' '));
  const db = await TnpDB.Instance;
  let projects = db.getProjects()
    .map(p => p.project)
    .filter(p => !p.isGenerated);

  const igt = path.join(Project.Tnp.location, '../..', 'igt');
  // console.log('igt', igt)
  const unknowNPm: Project[] = [];
  if (fse.existsSync(igt)) {
    projects = projects.concat(fse.readdirSync(igt)
      .map(f => {
        f = path.join(igt, f);
        const proj = Project.From(f)
        // console.log(`${f} proj name: ${proj && proj.name}`);
        if (proj) {
          unknowNPm.push(proj)
        }
        return proj;
      }));
  }

  unknowNPm.forEach(p => {
    const external = path.join(p.location, 'external');
    if (fse.existsSync(external)) {
      projects = projects.concat(fse.readdirSync(external)
        .map(f => {
          f = path.join(external, f);
          const proj = Project.From(f)
          // console.log(`external proj name: ${proj && proj.name}`);
          if (proj) {
            unknowNPm.push(proj)
          }
          return proj;
        }));
    }
  });

  const projectsToOpen = args.trim().split(' ');
  const projectForAction: Project[] = [];

  projectsToOpen.forEach(projectName => {
    try {
      var regex = new RegExp(projectName);
    } catch (err) {
      error(`Invalid regular expresion: ${projectName}`, false, true)
    }

    // console.log(`source: "${regex.source}"`)
    const projs = projects.filter(p => {
      return p && (p.genericName === projectName || regex.test(p.name))
    });
    if (projs) {
      projs.forEach(c => projectForAction.push(c));
    } else {
      error(`Cannot find project: "${projectName}"`, true, true)
    }

    // projects.forEach(p => {
    //   console.log(`Test: ${p && p.name} with ${regex.source} ${p && regex.test(p.name)}`)
    //   return p && regex.test(p.name);
    // });

  });

  killvscode('', false);
  for (let index = 0; index < projectForAction.length; index++) {
    const projectToOpen = projectForAction[index];
    projectToOpen.openInVscode();
  }
  process.exit(0)
}

export default {
  develop,
  killvscode,
  vscodekill(args) {
    killvscode(args);
  },
  close(args) {
    killvscode(args);
  },
}
