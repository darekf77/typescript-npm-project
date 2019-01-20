//#region @backend
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as  psList from 'ps-list';
import * as _ from 'lodash';
import { LowdbSync } from 'lowdb';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'
import { Project } from '../project/base-project';
import { ProjectFrom } from '../project';
import { map } from 'rxjs/operator/map';
import { DomainInstance } from './domain-instance';
import { PortInstance } from './port-instance';
import { BuildInstance } from './build-instance';
import { PsListInfo } from './ps-info';
import { BuildOptions, BuildData } from '../models';
import { Range } from '../helpers';
import { ENTITIES } from './entities';
import { PortsSet } from './ports-set';
import { SystemService } from './system-service';
import { CommandInstance } from './command-instance';
import { start } from '../start';
import { error, warn } from '../messages';
import { getWorkingDirOfProcess, killProcess, questionYesNo } from '../process';
import { prompt } from 'enquirer'
import * as inquirer from 'inquirer';


export class TnpDB {

  private static _instance: TnpDB;

  private static _firstTimeInit = true;

  private static async instance() {
    if (!this._instance) {
      const location = path.join(Project.Tnp.location, `bin/db.json`);
      this._instance = new TnpDB(location)
      await this._instance.init(!fse.existsSync(location))
    }
    return this._instance;
  }
  public static get Instance() {
    return this.instance()
  }

  public static get InstanceSync() {
    if (!this._instance) {
      error(`Please use (await TnpDB.Instance) here`);
    }
    return this._instance;
  }

  private _adapter;
  private db;
  public async init(recreate = true) {
    if (recreate) {
      fse.writeFileSync(this.location, '')
    }
    this._adapter = new FileSync(this.location)
    this.db = low(this._adapter)
    if (recreate) {
      console.log('[wrapper-db]recreate values')
      this.db.defaults({ projects: [], domains: [], ports: [], builds: [], commands: [] })
        .write()
      this.updateAndAdd.existedProjects()
      this.updateAndAdd.existedDomains()
      await this.updateAndAdd.existedBuilds();


      const defaultPorts: PortInstance[] = [


        new PortInstance([80, 443], new SystemService('http(s) related')),
        new PortInstance(Range.from(4000).to(6000))

      ]
      this.set.ports(defaultPorts);
    }
  }

  private get getAll() {
    const self = this;
    return {
      get commands(): CommandInstance[] {
        const res = (self.db.get(ENTITIES.COMMANDS).value() as CommandInstance[])
        if (_.isArray(res)) {
          return res.map(cmd => {
            const c = new CommandInstance();
            c.command = cmd.command;
            c.location = cmd.location;
            return c;
          })
        };
        return [];
      },
      get projects() {
        const res = (self.db.get(ENTITIES.PROJECTS).value() as string[])
        if (_.isArray(res)) {
          return res.map(location => ProjectFrom(location))
        };
        return [];
      },

      get domains() {
        const res = (self.db.get(ENTITIES.DOMAINS).value() as any[])
        if (_.isArray(res)) {
          return res.map(v => {
            const d: DomainInstance = _.merge(new DomainInstance(), v);
            d.declaredIn = d.declaredIn.map(d => {
              return { environment: d.environment, project: ProjectFrom(d.project as any) }
            })
            return d;
          })
        }
        return []
      },

      get builds() {
        const res = (self.db.get(ENTITIES.BUILDS).value() as any[])
        if (_.isArray(res)) {
          return res.map(v => {
            const ins: BuildInstance = _.merge(new BuildInstance(), v)
            ins.buildOptions = _.merge(new BuildOptions(), ins.buildOptions)
            return ins;
          })
        }
        return [];
      }
    }
  }


  private discoverFrom(project: Project) {
    if (!project) {
      return
    }

    this.db.get(ENTITIES.PROJECTS).push(project.location).write();
    if (_.isArray(project.children)) {
      project.children.forEach(c => this.discoverFrom(c))
    }
    this.discoverFrom(project.preview)
  }

  public static get prepareToSave() {
    return {
      build(build: BuildInstance) {
        const { pid, project, location, buildOptions, cmd } = build;
        return _.cloneDeep({
          buildOptions: _.merge({}, _.omit(buildOptions, BuildOptions.PropsToOmmitWhenStringify)),
          pid,
          cmd,
          location: _.isString(location) ? location : project.location
        }) as BuildInstance;
      },
      port(port: PortInstance) {
        return _.cloneDeep({
          id: port.id,
          reservedFor: !!port.reservedFor && _.isString((port.reservedFor as Project).location) ?
            (port.reservedFor as Project).location : port.reservedFor
        } as PortInstance);
      },
      command(cmd: CommandInstance) {
        const { command, location } = cmd;
        return _.cloneDeep({
          command, location
        } as CommandInstance);
      },
      domain(domain: DomainInstance) {
        const { activeFor, address, secure, production, declaredIn, sockets } = domain;
        return _.cloneDeep({
          declaredIn: declaredIn.map(d => {
            return { environment: d.environment, project: d.project.location }
          }) as any,
          address,
          production,
          secure,
          sockets
        } as DomainInstance);
      }
    }
  }


  private get set() {
    const self = this;
    return {
      commands(commands: CommandInstance[]) {
        const json = commands.map(c => TnpDB.prepareToSave.command(c));
        self.db.set(ENTITIES.COMMANDS, json).write()
      },
      builds(builds: BuildInstance[]) {
        const json = builds.map(c => TnpDB.prepareToSave.build(c));
        self.db.set(ENTITIES.BUILDS, json).write()
      },
      ports(ports: PortInstance[]) {
        const json = ports.map(c => TnpDB.prepareToSave.port(c));
        // console.log('ports to save', ports)
        self.db.set(ENTITIES.PORTS, json).write()
      },
      domains(domains: DomainInstance[]) {
        const json = domains.map(c => TnpDB.prepareToSave.domain(c));
        // console.log('ports to save', ports)
        self.db.set(ENTITIES.DOMAINS, json).write()
      }
    }
  }

  private discoverProjectsInLocation(location: string) {
    // this.discoverFrom(Project.Tnp);
    fse.readdirSync(location)
      .map(name => path.join(location, name))
      .map(location => {
        // console.log(location)
        return ProjectFrom(location)
      })
      .filter(f => !!f)
      .filter(f => {
        // console.log(`Type for ${f.name} === ${f.type}`)
        return f.type !== 'unknow-npm-project'
      })
      .forEach(project => {
        // console.log(project.name)
        this.discoverFrom(project)
      })
  }



  private get updateAndAdd() {
    const self = this;

    return {

      async existedBuilds() {
        const ps: PsListInfo[] = await psList();
        // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));
        const builds = ps
          .filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0)
          .map(p => {
            const location = getWorkingDirOfProcess(p.pid);
            const project = ProjectFrom(location)
            if (project) {
              const b = new BuildInstance({
                location: getWorkingDirOfProcess(p.pid),
                pid: p.pid,
                cmd: p.cmd
              });
              // console.log('result build instance', b)
              return b;
            }
          })
          .filter(b => !!b)
          .filter(b => b.isTnpProjectBuild)

        self.set.builds(builds);
      },

      existedProjects() {
        self.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, '..')))
        self.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, 'projects')))
      },

      existedDomains() {
        const domains: DomainInstance[] = [];
        self.getAll.projects.forEach(project => {
          if (!project.isWorkspaceChildProject && project.env &&
            project.env.config && project.env.config.domain) {

            // console.log(`Domain detected: ${p.env.config.domain}, env:${p.env.config.name} `)
            const address = project.env.config.domain;
            const environment = project.env.config.name;
            const existed = domains.find(d => d.address === address);
            if (existed) {
              existed.declaredIn.push({ project, environment })
            } else {
              const domain = new DomainInstance()
              domain.address = address;
              domain.declaredIn = [{ project, environment }]
              domains.push(domain)
            }

          }
        })

        self.set.domains(domains);

      },

      projectIfNotExist(project: Project) {
        if (!self.getAll.projects.includes(project)) {
          self.discoverFrom(project);
        }
      },

      buildIfNotExistOrReturnExisted(project: Project, buildOptions: BuildOptions, pid: number): BuildInstance {
        const currentB = new BuildInstance({ buildOptions, pid, location: project.location })
        const existed = self.getAll.builds.find(b => b.isEqual(currentB))
        if (_.isObject(existed)) {
          return existed;
        }
        self.db.get(ENTITIES.BUILDS).push(TnpDB.prepareToSave.build(currentB)).write()
      }

    }
  }

  get ports() {

    let res = (this.db.get(ENTITIES.PORTS).value() as any[])
    if (_.isArray(res)) {
      res = res.map(v => {
        const r = _.merge(new PortInstance(), v) as PortInstance;
        if (_.isString(r.reservedFor)) {
          r.reservedFor = ProjectFrom(r.reservedFor)
        }
        return r;
      })
    } else {
      res = []
    }

    return new PortsSet(res, (ports) => {
      this.set.ports(ports);
    });
  }

  get projects() {
    const self = this;
    return {
      discoverExistedProjects() {
        self.updateAndAdd.existedProjects()
        console.log(self.getAll.projects)
      }
    }
  }

  get builds() {
    const self = this;
    return {
      remove(build: BuildInstance) {
        const builds = self.getAll.builds.filter(b => !b.isEqual(build));
        // console.log('after rem', builds)
        self.set.builds(builds);
      }
    }
  }

  get commands() {
    const self = this;
    const commands = this.getAll.commands;
    return {
      setCommand(location: string, command: string) {
        const cmd = commands.find(c => c.location === location);
        if (cmd) {
          cmd.command = command;
        } else {
          const c = new CommandInstance();
          c.location = location;
          c.command = command;
          commands.push(c)
        }
        self.set.commands(commands)
      },
      lastCommandFrom(location: string): CommandInstance {
        const cmd = commands.find(c => c.location === location)
        return cmd;
      },

      update(cmd: CommandInstance) {
        const c = commands.find(c => c.location === cmd.location)
        c.command = cmd.command;
        self.set.commands(commands)
      },

      async runCommand(cmd: CommandInstance) {
        if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
          await start(cmd.command.split(' '));
        } else {
          error(`Last command for location: ${cmd.location} doen't exists`, false, true);
        }
      },
      async runLastCommandIn(location: string) {
        const cmd = commands.find(c => c.location === location)
        if (cmd) {
          await start(cmd.command.split(' '));
        } else {
          error(`Last command for location: ${cmd.location} doen't exists`, false, true);
        }
      }
    }
  }


  constructor(private location: string) {



  }


  get notify() {
    const self = this;
    return {
      get when() {
        return {
          async BUILD(currentProject: Project, buildOptions: BuildOptions, pid: number) {
            self.updateAndAdd.projectIfNotExist(currentProject);
            while (true) {
              const existed = self.updateAndAdd.buildIfNotExistOrReturnExisted(currentProject, buildOptions, pid);



              if (existed) {

                const kill = () => {
                  try {
                    killProcess(existed.pid)
                  } catch (error) {
                  }
                  self.builds.remove(existed)
                }

                if (!existed.buildOptions.watch) {
                  warn('automatic kill of active build instance in static build mode')
                  kill()
                  continue;
                } else {
                  const confirm = await questionYesNo(`There is active process on pid ${existed.pid}, do you wanna kill this process ?
                  build options: ${existed.buildOptions.toString()}`)
                  if (confirm) {
                    kill();
                    continue;
                  } else {
                    process.exit(0)
                  }
                }
              }
              break;
            }

          },
          async INIT(currentProject: Project) {
            self.updateAndAdd.projectIfNotExist(currentProject);
          },
          async CLEAN(currentProject: Project) {
            self.updateAndAdd.projectIfNotExist(currentProject);
          },
          async ANY_COMMAND(location: string, args: string[]) {
            self.commands.setCommand(location, args.join(' '))
          }
        }
      }
    }
  }


  get checkIf() {
    const self = this;
    return {
      get allowed() {
        return {
          toRunBuild(project: Project, options: BuildOptions) {

          },
          toInstallTnp(project: Project) {
            return true;
          },
          toWatchWorkspace(workspaceChild: Project) {
            return true;
          }

        }
      }
    }
  }
}



//#endregion
