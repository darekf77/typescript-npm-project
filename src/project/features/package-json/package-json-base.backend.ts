
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from "chalk";

import { Project } from "../../abstract";
import { LibType, InstalationType, IPackageJSON, DependenciesFromPackageJsonStyle, UIFramework } from "../../../models";
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log, HelpersLinks } from "../../../helpers";
import { config } from '../../../config';



import * as _ from "lodash";
import { Morphi } from 'morphi';
import { getDepsBy, reolveAndSaveDeps } from './package-json-helpers.backend';




export class PackageJsonBase {

    public data: IPackageJSON;
    public readonly location: string;
    public readonly project: Project;
    private reasonToHidePackages: string = ''
    private reasonToShowPackages: string = ''

    //#region getters
    get type(): LibType {
        const res = this.data.tnp ? this.data.tnp.type : undefined;
        if (_.isString(res)) {
            return res;
        }
        if (this.data && this.data.name) {
            return 'unknow-npm-project';
        }
    }

    get frameworks(): UIFramework[] {
        const res = this.data.tnp &&
            _.isArray(this.data.tnp.frameworks) ? this.data.tnp.frameworks : config.frameworks;
        if (res.filter(f => !config.frameworks.includes(f)).length > 0) {
            error(`[packagejson][frameworks] Unrecognized  frameworks`
                + ` in package.json ${JSON.stringify(this.data.tnp.frameworks)}`)
        }
        return res;
    }

    get name() {
        return this.data.name;
    }

    get version() {
        return this.data.version;
    }

    get resources(): string[] {
        const p = this.data.tnp;
        return Array.isArray(p.resources) ? p.resources : [];
    }

    get workspaceDependencies(): string[] {
        const p = this.data.tnp && this.data.tnp.required;
        // console.log(`${this.locationOfJson}`, p)
        return Array.isArray(p) ? p : [];
    }

    get locationOfJson() {
        return path.join(this.location, config.file.package_json);
    }

    get pathToBaseline(): string {
        if (this.data && this.data.tnp &&
            (
                _.isString(this.data.tnp.basedOn) ||
                _.isString(this.data.tnp.basedOnAbsolutePath1) ||
                _.isString(this.data.tnp.basedOnAbsolutePath1)
            )
        ) {

            let pathToBaseline = path.resolve(path.join(path.dirname(this.location), this.data.tnp.basedOn));
            if (fse.existsSync(pathToBaseline)) {
                this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
                return pathToBaseline;
            }
            warn(`pathToBaseline not exists: ${pathToBaseline}`)

            // TODO quick fix
            pathToBaseline = this.data.tnp.basedOnAbsolutePath1;
            if (fs.existsSync(pathToBaseline)) {
                this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
                return pathToBaseline;
            }
            warn(`pathToBaseline not exists: ${pathToBaseline}`)

            pathToBaseline = this.data.tnp.basedOnAbsolutePath2;
            if (fs.existsSync(pathToBaseline)) {
                this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
                return pathToBaseline;
            }
            warn(`pathToBaseline not exists: ${pathToBaseline}`)

            if (!global[config.message.tnp_normal_mode] && !global.testMode) {
                warn(`[tnp][isSite] Returning undefined to not show error message: ${this.data.tnp.basedOn} `)
                return;
            }
            console.log('DATA TNP', this.data.tnp)
            error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.location})

      path desn't exist: ${pathToBaseline}

      `)
        }
    }

    get isCoreProject() {
        if (this.data.tnp && !_.isUndefined(this.data.tnp.isCoreProject)) {
            if (_.isBoolean(this.data.tnp.isCoreProject)) {
                return this.data.tnp.isCoreProject;
            }
            error(`Bad value in package.json, tnp.isCoreProject should be boolean.`, true);
            error(`Location of package.json: ${this.location}`)
        }
        return false;
    }

    get isCommandLineToolOnly() {
        if (this.data.tnp && !_.isUndefined(this.data.tnp.isCommandLineToolOnly)) {
            if (_.isBoolean(this.data.tnp.isCommandLineToolOnly)) {
                return this.data.tnp.isCommandLineToolOnly;
            }
            error(`Bad value in package.json, tnp.isCommandLineToolOnly should be boolean.`, true);
            error(`Location of package.json: ${this.location}`)
        }
        return false;
    }

    get isGenerated() {
        if (this.data.tnp && !_.isUndefined(this.data.tnp.isGenerated)) {
            if (_.isBoolean(this.data.tnp.isGenerated)) {
                return this.data.tnp.isGenerated;
            }
            error(`[isGenerated] Bad value in package.json, tnp.isGenerated should be boolean.`, true, true);
            error(`[isGenerated] Location of package.json: ${this.location}`, true, true)
        }
        return false;
    }


    get useFramework() {
        if (this.data.tnp && !_.isUndefined(this.data.tnp.useFramework)) {
            if (_.isBoolean(this.data.tnp.useFramework)) {
                return this.data.tnp.useFramework;
            }
            error(`Bad value in package.json, tnp.useFramework should be boolean.`, true);
            error(`Location of package.json: ${this.location}`)
        }
        return false;
    }
    //#endregion

    constructor(options: { data: Object, location?: string; project?: Project; }) {
        if (_.isObject(options)) {
            if (options.project && !options.location) {
                options.location = options.project.location;
            }
            _.merge(this, options);

            this.data = _.merge({
                tnp: {
                    resources: []
                }
            } as IPackageJSON, options.data as any);
        }

    }

    private fixUnexistedBaselineInNOdeModules(pathToBaseline: string) {
        const baselineInNodeModuels = path.join(this.location, config.folder.node_modules, path.basename(pathToBaseline))
        if (!fse.existsSync(baselineInNodeModuels)) {
            HelpersLinks.createSymLink(pathToBaseline, baselineInNodeModuels)
        }
    }

    public copyTo(project: Project) {
        const packageJsonloCation = path.join(this.project.location, config.file.package_json);
        const dest = path.join(project.location, config.file.package_json);
        fse.copyFileSync(packageJsonloCation, dest);
    }

    public save() {
        const filePath = path.join(this.location, config.file.package_json);
        fse.writeJSONSync(filePath, this.data, {
            encoding: 'utf8',
            spaces: 2
        });
        // info('package.json saved')
    }

    public show(reasonToShowPackages: string) {
        this.reasonToShowPackages = `\n${reasonToShowPackages}`;
        this.saveForInstallation(true);
    }

    public hide(reasonToHidePackages: string) {
        this.reasonToHidePackages = `\n${reasonToHidePackages}`;
        this.saveForInstallation(false)
    }

    public updateHooks() {
        if (!(this.data.husky && this.data.husky.hooks && _.isString(this.data.husky.hooks["pre-push"]))) {
            this.data.husky = {
                hooks: {
                    "pre-push": "tnp deps:show:if:standalone"
                }
            }
            this.save()
        }
    }


    public coreRecreate() {
        const coreProject = Project.Tnp;
        const addedDeps = coreProject.packageJson.data.dependencies;
        const addedDevDeps = coreProject.packageJson.data.devDependencies;
        const deps = _.merge({}, addedDeps, addedDevDeps);
        const coreDeps = getDepsBy(undefined, (obj, pkgName) => {
            if (deps[pkgName]) {
                obj[pkgName] = deps[pkgName];
            }
            return obj[pkgName];
        });
        coreProject.packageJson.save()
        coreProject.packageJson.reload()
        coreProject.packageJson.saveForInstallation(false, false)
    }


    private saveForInstallation(showPackagesinFile = true, coreRecreate = true) {

        if (!showPackagesinFile && this.project.isTnp) {
            showPackagesinFile = true;
        }

        // log(`save for install in ${this.project.name} ! `)
        if (coreRecreate) {
            this.coreRecreate()
        }
        this.reload()
        if (this.project.isWorkspace || this.project.isWorkspaceChildProject || this.project.isContainer) {
            this.recreateForWorkspaceOrContainer(showPackagesinFile)
        } else if (this.project.isStandaloneProject) {
            this.recreateForStandalone(showPackagesinFile)
        }
    }


    private restrictVersions(obj: DependenciesFromPackageJsonStyle) {
        Object.keys(obj).forEach(name => {
            if (obj[name].startsWith('^')) {
                obj[name] = obj[name].slice(1)
            }
            if (obj[name].startsWith('~')) {
                obj[name] = obj[name].slice(1)
            }
        })
    }


    private recreateForWorkspaceOrContainer(recreateInPackageJson: boolean) {
        const workspace = (this.project.isWorkspace || this.project.isContainer) ? this.project : (this.project.isWorkspaceChildProject ? this.project.parent : undefined)
        reolveAndSaveDeps(workspace, void 0, recreateInPackageJson, this.reasonToHidePackages, this.reasonToShowPackages)
    }

    private recreateForStandalone(recreateInPackageJson: boolean) {
        let newDeps = getDepsBy(this.project.isTnp ? void 0 : this.project.type);
        reolveAndSaveDeps(this.project, newDeps, recreateInPackageJson, this.reasonToHidePackages, this.reasonToShowPackages);
    }

    private reload() {
        try {
            const file = fs.readFileSync(path.join(this.location, config.file.package_json), 'utf8').toString();
            const json = JSON.parse(file);
            if (!json.tnp) {
                // warn(`Unrecognized project type from package.json in location: ${location}`, false);
            }
            this.data = json;
        } catch (e) {
            error(`Error during reload package.json from ${this.location}
        ${e}
      `)
        }
    }
}

