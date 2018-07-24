import { Project } from '../project';
import * as child from "child_process";
import * as path from "path";
import * as glob from "glob";
import * as fse from "fs-extra";
import * as fs from "fs";
import * as _ from "lodash";
import { run as __run } from '../process';
import { error, info } from '../messages';
import { pullCurrentBranch } from '../helpers-git';
import { tryRemoveDir, findChildren } from '../helpers';
import config from '../config';
import { RunOptions } from '../models';

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
      "activityBar.background": (location, name) => {
        const defaultColors = {
          'xxx-ui': "#72a25c",
          'es-rs-ui': '#a25c5c',
          'es-common': '#a1a25c',
          'wvs-ui': '#925ca2',
          'sce-ui': '#a2925c',
        }
        return (defaultColors[name]) ? defaultColors[name] : defaultColors['xxx-ui'];
      },
      "activityBar.foreground": "#665968"
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
    "command": "npm",
    "isShellCommand": true,
    "showOutput": "always",
    "suppressTaskName": true,
    "tasks": [{
      "taskName": "install",
      "args": [
        "run",
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



export type AurorProjectType = 'parent-baseline-fork' | 'child-baseline-module';

class ProjectAurora {

  readonly children: ProjectAurora[] = [];
  readonly prefix: string;
  readonly externalPath: string;
  readonly name: string;

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
    const externalExist = (fs.existsSync(path.join(location, FOLDERS.EXTERNAL)));
    const p = new ProjectAurora(
      location,
      externalExist ? 'parent-baseline-fork' : 'child-baseline-module',
      parent
    );
    return p;
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

  get fix() {
    const self = this;
    return {
      config(obj) {
        if (_.isObject(obj)) {
          Object.keys(obj).forEach(key => {
            if (_.isFunction(obj[key])) {
              obj[key] = obj[key](self.location, self.name)
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
    this.updateVscode()
    info(`Project ${this.name}, prefix ${this.prefix}`)
  }

  private readonly allowedBaselineLibs = ['es-rs-ui', 'es-common'];
  add(subProjectName: 'es-rs-ui' | 'es-common') {
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
    pullCurrentBranch(this.location);
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

}




export default {
  $AURORA: (args: string) => {

    let project = ProjectAurora.From(process.cwd())
    const a = args.split(' ');

    if (!project) {
      error(`This is not aurora type project`)
    }


    if (project.Type === 'parent-baseline-fork') {

      if (a.length == 0) {
        project.link()
        project.pullCurrentBranch()
        project.children.forEach(c => {
          c.pullCurrentBranch()
        })

      } else {
        a.forEach((param, i) => {
          if (param === 'link') {
            project.link()
          } else if (param === 'add') {
            project.add(a[i + 1] as any);
          } else if (param === 'git') {
            project.pullCurrentBranch()
          } else if (param === 'vscode') {
            project.updateVscode()
            project.children.forEach(c => {
              c.updateVscode()
            })
          }
        })
      }

    } else {
      error(`Please start commands from folder level: xxx-ui`);
    }


    process.exit(0)
  }
};


