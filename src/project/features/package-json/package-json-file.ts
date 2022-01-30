//#region imports
import { _ } from "tnp-core";
//#region @backend
import { path } from "tnp-core";
//#endregion
import { config, ConfigModels } from "tnp-config";
import { Models } from "tnp-models";
import { Helpers } from 'tnp-helpers';
//#endregion

const OVERRIDE_FROM_TNP = [ // TODO put in config ?
  'scripts',
  'description',
  'license',
  'private',
  'author',
  'homepage',
  'main',
  'engines',
  'categories',
  'keywords',
  'activationEvents',
];

export type SaveRequests = {
  additionalSaveRequired: boolean;
};

export class PackageJsonFile {
  //#region static fields & methods
  static readonly FRAMEWORK_KEY_OLD = 'tnp';
  static from(fullPath: string) {
    return new PackageJsonFile(fullPath);
  }
  //#endregion

  //#region fields & getters
  public get exists() {
    return Helpers.exists(this.fullPath);
  }

  private get hasIncorrectContent() {
    return !this.exists || this.notReadable;
  }

  public get isReadable() {
    return !this.hasIncorrectContent;
  }

  get isTnpTypeProject() {
    return !!this.content?.tnp?.type;
  }

  get data() {
    return _.cloneDeep(this.content);
  }

  get containsOnlyTnpMetadata() {
    return this.__actuallProp === 'tnp';
  }

  get saveAtLoad() {
    return this.isTnpTypeProject && this.additionalSaveRequired && !Helpers.isLink(this.fullPath);
  }

  private notReadable: boolean = false;
  private additionalSaveRequired: boolean = false;
  private readonly content: Models.npm.IPackageJSON;
  private readonly __actuallProp: string;
  //#endregion

  private constructor(
    public readonly fullPath: string) {
    //#region @backend
    this.fullPath = fullPath;
    let content = Helpers.readJson(fullPath, void 0) as Models.npm.IPackageJSON;
    if (content && !content.name) { // WHY => tnp prop doesn't have name property
      const actuallProp = path.basename(fullPath)
        .replace(config.file.package_json, '')
        .replace('.json5', '')
        .replace('.json', '')
        .replace('_', '');

      this.__actuallProp = actuallProp;

      content = {
        [actuallProp]: content
      } as any as Models.npm.IPackageJSON;
    }

    if (content) {
      this.additionalSaveRequired = consistencyFixes(
        content,
        fullPath,
        PackageJsonFile.FRAMEWORK_KEY_OLD
      ).additionalSaveRequired;

      this.content = content;
      this.content.tnp = this.content.tnp ? this.content.tnp : {} as any;
      this.applyTnpToContent();
    } else {
      this.notReadable = true;
      if (this.exists && path.basename(this.fullPath) === config.file.package_json) {
        this.content = {} as any;
        this.content.tnp = {} as any;
      }
    }
    //#endregion
  }

  //#region api / apply tnp to content
  private applyTnpToContent(): void {
    let additionalSaveRequired = this.additionalSaveRequired;
    //#region merging
    const content = (this.content) as Models.npm.IPackageJSON;
    const override = (this.content[PackageJsonFile.FRAMEWORK_KEY_OLD]) as (Models.npm.Tnp);
    const allKeys = [
      ...Object.keys(content),
      ...Object.keys(override),
    ];


    allKeys
      .filter(key =>
        OVERRIDE_FROM_TNP.includes(key)
      )
      .forEach(key => {
        const contentValue = content[key];
        const overrideValue = override[key];

        if (!(_.isUndefined(contentValue) && _.isUndefined(overrideValue))) {
          if (_.isUndefined(overrideValue) && !_.isNil(contentValue) && !OVERRIDE_FROM_TNP.includes(key)) {

            if (_.isObject(contentValue[key])) {
              override[key] = _.cloneDeep(contentValue[key]);
            } else {
              override[key] = contentValue[key];
            }

            additionalSaveRequired = true;
          } else if (!this.containsOnlyTnpMetadata) {
            if (!additionalSaveRequired && !_.isEqual(override[key], content[key])) {
              additionalSaveRequired = true;
            }

            if (_.isObject(override[key])) {
              content[key] = _.cloneDeep(override[key]);
            } else {
              content[key] = override[key];
            }

          }
        }

      });
    //#endregion
    this.additionalSaveRequired = additionalSaveRequired;
  }
  //#endregion

  //#region api / merge with higer priority package.json
  mergeWith(higherPriorityPjWithOnlyTnpProps: PackageJsonFile) {
    let additionalSaveRequired = this.additionalSaveRequired || this.notReadable;
    //#region merging
    if (!higherPriorityPjWithOnlyTnpProps.containsOnlyTnpMetadata) {
      Helpers.error(`Not able to merge higer priority package.json`);
    }

    const contentTnp = ((this.content) as Models.npm.IPackageJSON).tnp;
    const incommingTnp = (higherPriorityPjWithOnlyTnpProps).content?.tnp;

    const allKeys = [
      ...Object.keys(contentTnp),
      ...Object.keys(incommingTnp),
    ];

    allKeys
      .filter(key => !(_.isUndefined(contentTnp[key]) && _.isUndefined(incommingTnp[key])))
      .forEach(key => {

        if (!_.isUndefined(incommingTnp[key])) {
          if (!additionalSaveRequired && !_.isEqual(contentTnp[key], incommingTnp[key])) {
            additionalSaveRequired = true;
          }
          if (_.isObject(incommingTnp[key])) {
            contentTnp[key] = _.cloneDeep(incommingTnp[key]);
          } else {
            contentTnp[key] = incommingTnp[key];
          }

        }

      });
    //#endregion
    this.additionalSaveRequired = additionalSaveRequired;
    this.applyTnpToContent();
  }
  //#endregion

  //#region api / last checks
  lastChecks() {
    this.additionalSaveRequired = lastFixes(
      this.content,
      this.fullPath,
      PackageJsonFile.FRAMEWORK_KEY_OLD,
      this.additionalSaveRequired
    ).additionalSaveRequired;
  }
  //#endregion


}


//#region helpers



//#region helpers / last fixes to package.json
function lastFixes(
  content: Models.npm.IPackageJSON,
  fullPath: string,
  tnpProperty: typeof PackageJsonFile.FRAMEWORK_KEY_OLD,
  additionalSaveRequired = false
): SaveRequests {
  if (content[tnpProperty]
    && !!content[tnpProperty].type
    && content[tnpProperty].type !== 'navi'
  ) {
    const folderName = path.basename(path.dirname(fullPath)).toLowerCase();
    if (folderName !== content.name) {
      content.name = folderName;
      additionalSaveRequired = true;
    }

    if (!content.version) {
      let lastVersionFromNpm: string;
      try {
        lastVersionFromNpm = Helpers.run(`npm show ${content.name} version`
          , { output: false }).sync().toString().trim();
        if (lastVersionFromNpm) {
          additionalSaveRequired = true;
          content.version = lastVersionFromNpm;
        }
      } catch (error) {
        Helpers.warn(`Not able to get last version of project: ${content.name}`
          + ` from npm registry...`);
      }
    }
    if (!content.version) {
      additionalSaveRequired = true;
      content.version = '0.0.0';
    }

  }
  delete content['husky']; // TODO QUICK_FIX annyoning shit
  delete content['recreatedFrom'];

  return { additionalSaveRequired };
}
//#endregion

//#region helpers / props consitency fixes
function consistencyFixes(
  content: Models.npm.IPackageJSON,
  fullPath: string,
  tnpProperty: typeof PackageJsonFile.FRAMEWORK_KEY_OLD,
  additionalSaveRequired = false
): SaveRequests {

  if (!content) {
    // additionalSaveRequired = true; // NOT NEEDED
    content = {} as any;
  }

  if (!content[tnpProperty]) {
    additionalSaveRequired = true;
    content[tnpProperty] = {} as any;
  }

  if (!content[tnpProperty].overrided) {
    content[tnpProperty].overrided = {};
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].linkedProjects)) {
    content[tnpProperty].linkedProjects = [];
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].libReleaseOptions)) {
    content[tnpProperty].libReleaseOptions = {
      nodts: false,
      obscure: false,
      ugly: false,
    };
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].libReleaseOptions.nodts)) {
    content[tnpProperty].libReleaseOptions.nodts = false;
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].libReleaseOptions.obscure)) {
    content[tnpProperty].libReleaseOptions.obscure = false;
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].libReleaseOptions.ugly)) {
    content[tnpProperty].libReleaseOptions.ugly = false;
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].overrided.linkedFolders)) {
    content[tnpProperty].overrided.linkedFolders = [];
    additionalSaveRequired = true;
  }
  if (!_.isArray(content[tnpProperty].overrided.ignoreDepsPattern)) {
    content[tnpProperty].overrided.ignoreDepsPattern = ['*'];
    additionalSaveRequired = true;
  }
  if (_.isUndefined(content[tnpProperty].overrided.includeAsDev)) {
    content[tnpProperty].overrided.includeAsDev = [];
    additionalSaveRequired = true;
  }
  if (!_.isArray(content[tnpProperty].overrided.includeOnly)) {
    content[tnpProperty].overrided.includeOnly = [];
    additionalSaveRequired = true;
  }
  if (!content[tnpProperty].overrided.dependencies) {
    content[tnpProperty].overrided.dependencies = {};
    additionalSaveRequired = true;
  }
  if (!content.dependencies) {
    content.dependencies = {};
    additionalSaveRequired = true;
  }
  if (!content.devDependencies) {
    content.devDependencies = {};
    additionalSaveRequired = true;
  }
  if (!_.isArray(content[tnpProperty].resources)) {
    content[tnpProperty].resources = [];
    additionalSaveRequired = true;
  }

  return { additionalSaveRequired }

}
//#endregion

//#endregion
