import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as path from 'path';
import { IPackageJSON } from '../models';
import config from '../config';
import { tryRemoveDir, error } from '../helpers';

const PATHES = {
  BASE_FOLDER_TEST: config.pathes.tnp_tests_context,
  TNP_DB_FOT_TESTS: config.pathes.tnp_db_for_tests_json,
};


function RemoveTestCatalogs() {
  return function (target) {
    // tryRemoveDir(PATHES.BASE_FOLDER_TEST);
    if (!fse.existsSync(PATHES.BASE_FOLDER_TEST)) {
      fse.mkdirpSync(PATHES.BASE_FOLDER_TEST);
    }
    // tryRemoveDir(PATHES.TNP_DB_FOT_TESTS);

  }
}

type FuncTest = (locationContext: string, testName: string, options?: {
  packageJSON?: (relativePath: string, callback: (packageJSON: IPackageJSON) => void) => void;
  cwdChange: (relativePath: string, callback: () => void) => void
}) => any

type ItOptions = {
  removeTestFolder: boolean;
}


@RemoveTestCatalogs()
export class SpecWrap {

  private testsDescribtion: string;
  private kamelCaseTestName: string;
  private testName: string;
  private options?: ItOptions

  static create() {
    global.testMode = true;
    return new SpecWrap()
  }

  describe(testsDescribtion: string): string {
    this.testsDescribtion = testsDescribtion;
    return testsDescribtion;
  }


  async it(testName: string, callback: FuncTest, options?: ItOptions) {
    options = options || {} as any;
    if (_.isUndefined(options.removeTestFolder)) {
      options.removeTestFolder = true;
    }
    this.options = options;
    // await SpecHelper.wrapper_it(, callback);
    this.testName = testName;
    this.kamelCaseTestName = (`${_.kebabCase(this.testsDescribtion)}---${_.kebabCase(testName)}`)
    try {
      await this.run(callback)
    } catch (error) {

    }

  }

  private packageJSON(location: string) {
    return (relativePath: string, callback) => {
      const fullPath = path.join(location, relativePath, config.file.package_json);
      if (!fse.existsSync(fullPath)) {
        throw `Package json doesn't exist in ${fullPath}`
      }
      const c = fse.readJSONSync(fullPath, {
        encoding: 'utf8'
      });
      if (_.isFunction(callback)) {
        callback(c);
      }
      fse.writeJSONSync(fullPath, c, {
        encoding: 'utf8',
        spaces: 2
      })
    }
  }

  private cwdChange(location) {
    return async (relativePath: string, callback) => {
      const oldCwd = process.cwd()
      const newCWD = path.join(location, relativePath);
      if (!fse.existsSync(newCWD)) {
        error(`[cwdChange] cannot change cwd to unexisted location: ${newCWD}`)
      }
      process.chdir(newCWD);
      if (_.isFunction(callback)) {
        await this.runSyncOrAsync(callback)
      }
      process.chdir(oldCwd);
    }
  }

  async run(test: FuncTest) {

    const location = path.join(path.join(PATHES.BASE_FOLDER_TEST, this.kamelCaseTestName));

    if (this.options.removeTestFolder) {
      rimraf.sync(location);
    }
    if (!fse.existsSync(location)) {
      fse.mkdirpSync(location);
    }


    const oldCwd = process.cwd()
    process.chdir(location);

    await this.runSyncOrAsync(() => {
      return test(location, this.testName, {
        packageJSON: this.packageJSON(location),
        cwdChange: this.cwdChange(location)
      })
    })

    process.chdir(oldCwd);


  }

  async runSyncOrAsync(fn: Function) {
    if (_.isUndefined(fn)) {
      return;
    }
    // let wasPromise = false;
    let promisOrValue = fn()
    if (promisOrValue instanceof Promise) {
      // wasPromise = true;
      promisOrValue = Promise.resolve(promisOrValue)
    }
    // console.log('was promis ', wasPromise)
    return promisOrValue;
  }


}
