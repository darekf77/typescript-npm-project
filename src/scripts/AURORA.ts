import * as child from "child_process";
import * as path from "path";
import * as glob from "glob";
import * as fse from "fs-extra";
import * as simpleGit from 'simple-git/promise';
import * as fs from "fs";
import * as _ from "lodash";
import { run as __run } from '../process';
import { error, info } from '../messages';
import { pullCurrentBranch } from '../helpers-git';
import { tryRemoveDir, findChildren } from '../helpers';
import config from '../config';
import { RunOptions } from '../models';
import { run } from '../../node_modules/morphi';

//#region configs
const defaultColors = {
  'gas-ui': "#72a25c",
  'es-rs-ui': '#ff7e7e',
  'es-common': '#ffe552',
  'es-ips-ui': '#59a2d3',
  'wvs-ui': '#925ca2',
  'sce-ui': '#be7d41',
  'ncl-ui': '#be4175',
  'vas-ui': '#be7d41',
}

const vscode = {
  extensions: {
    "recommendations": [
      "ritwickdey.create-file-folder",
      "alexdima.copy-relative-path",
      "IBM.output-colorizer",
      "xabikos.javascriptsnippets",
      "henry-li.vscode-import-formatter",
      "EditorConfig.editorconfig",
      "dbaeumer.vscode-eslint",
      "nemesv.copy-file-name",
      "momoko8443.library-version",
      "cg-cnu.vscode-path-tools"
    ]
  },
  settings: {
    "files.exclude": {
      "**/.git": true,
      "**/.svn": true,
      "**/.hg": true,
      "**/CVS": true,
      "**/.DS_Store": true,
      ".build": true,
      ".idea": true,
      // "external": false,

      // vendor
      "**/vendor": false,
      "**/vendor/.*": true,
      "**/vendor/[abcdfghijklmnopqrstuvwxyz]*": true,
      "**/vendor/e[abcdefghijklmnopqrtuvwxyz]*": true,
      "**/vendor/es[0-9abcdefghijklmnopqrstuvwxyz]*": true,

      // node modules
      "**/node_modules": false,
      "**/node_modules/.*": true,
      "**/node_modules/[abcdfghijklmnopqrstuvwxyz]*": true,
      "**/node_modules/e[abcdefghijklmnopqrtuvwxyz]*": true,
      "**/node_modules/es[0-9abcdefghijklmnopqrstuvwxyz]*": true
    },
    "workbench.colorTheme": "Default Dark+",

    "workbench.colorCustomizations": {
      "activityBar.background": ({ name }) => {

        return (defaultColors[name]) ? defaultColors[name] : defaultColors['xxx-ui'];
      },
      "activityBar.foreground": "#665968",
      "statusBar.background": (project: ProjectAurora) => {
        const hasParent = !!(project.parent)
        return hasParent ? defaultColors[project.parent.name] : defaultColors[project.name]
      }
    },
    "editor.rulers": [
      100, 120
    ],

    "search.exclude": {
      "**/.git": true,
      "**/node_modules/es-rs-ui": true,
      "**/bower_components": true,
      "**/vendor": true
    },

    "eslint.enable": true,
    "eslint.options": {
      "configFile": "node_modules/es-build-ui/.eslintrc"
    },
    "files.autoSave": "on",
    "eslint.autoFixOnSave": true
  },
  tasks: {
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "0.1.0",
    "command": "tnp",
    "isShellCommand": true,
    "showOutput": "always",
    "suppressTaskName": true,
    "tasks": [{
      "taskName": "install",
      "args": [
        "aurora",
        "start"
      ],
      "isBuildCommand": true
    }
    ]
  }

}


const FOLDERS = {
  EXTERNAL: 'external',
  VENDOR: 'vendor'
}

//#endregion

export type AurorProjectType = 'parent-baseline-fork' | 'child-baseline-module';

class ProjectAurora {

  //#region static methods
  private static isAuroraProject(location: string) {
    // is aurora project - simple teest
    const bowerFile = path.join(location, 'bower.json');
    const bowerrc = path.join(location, '.bowerrc');
    return fs.existsSync(bowerFile) && fs.existsSync(bowerrc);
  }

  public static From(location: string, parent?: ProjectAurora): ProjectAurora {

    if (!ProjectAurora.isAuroraProject(location)) {
      error(`Cannot find aurora project in ${location} `, true)
      return
    }
    let externalExist = (fs.existsSync(path.join(location, FOLDERS.EXTERNAL)));

    if (!externalExist && path.basename(location).replace(/\-ui$/g, '').toLowerCase().length === 3) {
      fse.mkdirpSync(path.join(location, FOLDERS.EXTERNAL));
      info('"external" folder created... put baseline modules here.')
      externalExist = true;
    }

    const p = new ProjectAurora(
      location,
      externalExist ? 'parent-baseline-fork' : 'child-baseline-module',
      parent
    );
    return p;
  }
  //#endregion

  readonly children: ProjectAurora[] = [];
  readonly prefix: string;
  readonly externalPath: string;
  readonly name: string;
  private readonly allowedBaselineLibs = ['es-rs-ui', 'es-common', 'es-ips-ui'];

  get fix() {
    const self = this;
    return {
      config(obj) {
        if (_.isObject(obj)) {
          Object.keys(obj).forEach(key => {
            if (_.isFunction(obj[key])) {
              obj[key] = obj[key](self)
            } else if (_.isArray(obj[key])) {
              obj[key].forEach(o => self.fix.config(o))
            } else if (_.isObject(obj[key])) {
              self.fix.config(obj[key]);
            }
          });
        }
      }
    }
  }


  constructor(

    public readonly location: string,
    public readonly Type: AurorProjectType,
    readonly parent?: ProjectAurora
  ) {

    this.location = this.clearLocation(location);

    if (Type === 'parent-baseline-fork') {
      this.prefix = path.basename(this.location).replace(/\-ui$/g, '').toLowerCase()

      this.externalPath = path.join(this.location, FOLDERS.EXTERNAL)

      this.children = findChildren<ProjectAurora>(this.externalPath,
        childLocation => {
          return ProjectAurora.From(childLocation, this)
        });

    } else {
      this.prefix = this.parent.prefix;
    }


    this.name = this.nameFrom(this.location);
    // this.updateVscode()
    // info(`Project ${this.name}, prefix ${this.prefix}`)
  }


  private clearLocation(location: string) {
    if (location.endsWith('/')) {
      location = location.replace(/\/+$/, '');
    }

    if (location.endsWith('\\')) {
      location = location.replace(/\\+$/, '');
    }
    return location;
  }

  public updateVscode() {

    const vscodeDir = path.join(this.location, '.vscode')
    tryRemoveDir(vscodeDir)
    fse.mkdirpSync(vscodeDir);
    const vsc = _.cloneDeep(vscode);
    Object.keys(vsc).forEach(key => {
      // console.log('c', key)
      const vscConfigFile = path.join(vscodeDir, `${key}.json`);
      this.fix.config(vsc[key])

      fse.writeJsonSync(vscConfigFile, vsc[key], {
        encoding: 'utf8',
        spaces: 2
      })
    })


  }

  nameFrom(location: string) {
    return fse.readJsonSync(path.join(location, 'bower.json')).name;
  }


  add(subProjectName: 'es-rs-ui' | 'es-common' | 'es-ips-ui') {
    if (!this.allowedBaselineLibs.includes(subProjectName)) {
      error(`Wrong baseline lib type: ${subProjectName}`)
    }
    const paretOrigin = child.execSync(`git remote get-url --push origin`).toString().trim();
    const subProjectOrigin = paretOrigin.replace(`${this.prefix}-ui`, subProjectName);
    const newSubProjectName = `${this.prefix.toUpperCase()}-${subProjectName}`;
    const newSubProjectLocation = path.join(this.location, FOLDERS.EXTERNAL, newSubProjectName)
    const newSubProjectLocationOrigin = path.join(this.location, FOLDERS.EXTERNAL, subProjectName)

    if (fse.existsSync(newSubProjectLocation)) {
      tryRemoveDir(newSubProjectLocation)
    }

    if (fse.existsSync(newSubProjectLocationOrigin)) {
      tryRemoveDir(newSubProjectLocationOrigin)
    }
    const command = `git clone ${subProjectOrigin} ${newSubProjectName}`
    console.log(command)
    this.run(command, { cwd: path.join(this.location, FOLDERS.EXTERNAL) }).sync()
    const project = ProjectAurora.From(newSubProjectLocation, this)
    this.children.push(project)
    project.link()
  }

  run(command: string, options?: RunOptions) {
    if (!options) options = {}
    if (!options.cwd) options.cwd = this.location;
    return __run(command, options);
  }


  pullCurrentBranch() {
    console.log(`Pulling from git project ${this.name}`)
    pullCurrentBranch(this.location);
  }

  async rebase(targetRebaseBranch: string) {
    let git = simpleGit(this.location);
    let status = await git.status()
    const remote = 'origin'
    console.log('status', status)
    let branch = child.execSync(`cd ${this.location} && git branch | sed -n '/\* /s///p'`).toString().trim()

    let inStashChanges = false;
    if (status.isClean) {
      await git.pull(remote, branch)
    } else {
      this.run(`git stash`).sync();
      await git.pull(remote, branch)
      this.run(`git stash apply`).sync();
    }
    this.run(`git rebase ${targetRebaseBranch}`).sync();

    process.exit(0)
  }

  link() {
    if (this.Type === 'parent-baseline-fork') {

      this.children.forEach(child => child.link())

    } else if (this.Type === 'child-baseline-module') {
      const vendor = path.join(this.parent.location, FOLDERS.VENDOR)
      const vendorSubPorject = path.join(vendor, this.name)
      if (fse.existsSync(vendorSubPorject)) {
        tryRemoveDir(vendorSubPorject)
      }
      const command = `tnp ln ${this.location} ${vendor} && cd ${vendor} && tnp mv ${path.basename(this.location)} ${this.name}`
      // console.log(command)
      this.run(command).sync()
    }

  }

  start() {
    // this.run(`tnp killonport 9000`).sync()
    this.run(`npm run start`).sync()
  }

}




export default {
  $AURORA: (args: string) => {

    let project = ProjectAurora.From(process.cwd())
    const a = args.split(' ');
    let noExit = false;

    if (!project) {
      error(`This is not aurora type project`)
    }


    if (project.Type === 'parent-baseline-fork') {

      project.updateVscode()
      project.children.forEach(c => {
        c.updateVscode()
      })

      a.forEach((param, i) => {

        switch (param) {
          case 'link':
            project.link()
            break;

          case 'add':
            project.add(a[i + 1] as any);
            break;

          case 'git':
            project.pullCurrentBranch()
            break;

          case 'update':
            project.pullCurrentBranch()
            project.children.forEach(c => {
              c.pullCurrentBranch()
            })
            break;


          case 'rebase':
            noExit = true;
            project.rebase(a[i + 1])
            break;

          case 'start':

            project.start();
            break;

          default:
            break;
        }
      })

    } else {
      error(`Please start commands from folder level: xxx-ui`);
    }

    !noExit && process.exit(0)
  }
};


