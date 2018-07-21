import { Project } from '../project';
import * as child from "child_process";
import * as path from "path";
import * as glob from "glob";
import * as fse from "fs-extra";
import { run } from '../process';
import { error } from '../messages';
import { pullCurrentBranch } from '../helpers-git';
import { tryRemoveDir } from '../helpers';




class Aurora {

  readonly EXTERNAL = 'external';
  readonly VENDOR = 'vendor';
  readonly externalProjects: string[];
  readonly mainProjectPath: string;
  readonly externalPath: string;
  readonly prefix: string;

  constructor(mainProjectPath) {
    // const argsObj: { baseline: string } = require('minimist')(args.split(' '));

    // if (argsObj.baseline && ) {
    //   const cwd = process.cwd()
    //   child.execSync(``, { cwd })
    // }
    this.mainProjectPath = mainProjectPath
    this.externalPath = path.join(this.mainProjectPath, this.EXTERNAL)
    if (!fse.existsSync(this.externalPath)) {
      error(`This is not aurora project`)
    }
    this.prefix = path.basename(this.mainProjectPath).replace(/\-ui$/g, '').toLowerCase()

    // console.log('main prefix', mainPreix)
    let projects = glob.sync(`${this.externalPath}/*`)
    // console.log('raw glob', projects)
    projects = projects
      .map(p => path.basename(p))
    // console.log('projects basenames', projects)

    this.externalProjects = projects
      .filter(p => p.toLowerCase().startsWith(this.prefix));
  }


  updateProjectsGitOrigin() {

    pullCurrentBranch(process.cwd());
    this.externalProjects.forEach(p => {
      const pathSubPorject = path.join(this.mainProjectPath, this.EXTERNAL, p);
      pullCurrentBranch(pathSubPorject);
    })

  }



  linkPorjects() {
    const vendor = path.join(this.mainProjectPath, this.VENDOR)
    this.externalProjects.forEach(externalSubProject => {
      let pathSubPorject = path.join(this.mainProjectPath, this.EXTERNAL, externalSubProject);

      if (pathSubPorject.endsWith('/')) {
        pathSubPorject = pathSubPorject.replace(/\/+$/, '');
      }

      if (pathSubPorject.endsWith('\\')) {
        pathSubPorject = pathSubPorject.replace(/\\+$/, '');
      }

      const vendorPorjectName = externalSubProject.toLowerCase().replace(new RegExp(`^${this.prefix}\-`, 'g'), '')
      const vendorSubPorject = path.join(vendor, vendorPorjectName)
      if (fse.existsSync(vendorSubPorject)) {
        tryRemoveDir(vendorSubPorject)
      }

      const command = `tnp ln ${pathSubPorject}/ ${vendorSubPorject}`;
      console.log(command)
      run(command).sync()
    })
  }



}

export default {
  $AURORA: (args: string) => {

    const aurora = new Aurora(process.cwd())

    const a = args.split(' ');
    a.forEach(param => {
      if (param === 'link') {
        aurora.linkPorjects()
      } else if (param === 'git') {
        aurora.updateProjectsGitOrigin()
      }
    })

    process.exit(0)
  }
};


