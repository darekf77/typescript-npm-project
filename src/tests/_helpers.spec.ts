import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as path from 'path';

const PATHES = {
  BASE_FOLDER_TEST: path.join(__dirname, '..', '..', 'tmp-tests-context')
}


function RemoveTestCatalogs() {
  return function (target) {

    rimraf.sync(PATHES.BASE_FOLDER_TEST);
    fse.mkdirpSync(PATHES.BASE_FOLDER_TEST);

  }
}

@RemoveTestCatalogs()
export class SpecHelper {
  static id = 0;
  constructor(
    private testName: string
  ) {

  }

  static it(testName: string, testFN: (locationContext: string) => any) {
    try {
      it(testName, async () => {
        (new SpecHelper(_.kebabCase(testName)).run(testFN))
      });
    } catch (error) {

    }

  }

  async run(test: (locationContext: string) => any) {

    const location = path.join(path.join(PATHES.BASE_FOLDER_TEST, this.testName));
    rimraf.sync(location);
    fse.mkdirpSync(location);
    // try {
      await runSyncOrAsync(() => {
        return test(location)
      })
    // } catch (error) {

    // }

    return this;
  }


}

export async function runSyncOrAsync(fn: Function) {
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
