import { _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../abstract';

export class GlobalWorkerApps extends FeatureForProject {
  get detectGlobal() {
    //#region @backendFunc
    const isWin = (process.platform === 'win32')
    try {
      const command = `ls -al "\`npm root -g\`"`;
      const result = Helpers.run(command, { output: false }).sync().toString();
      return result.split('\n')
        .map(f => {
          return _.last(f.split(' ')).trim();
        })
        .map(f => {
          if (f.search('\/') !== -1) {
            if (isWin) {
              f = f.replace('\/', '')
            } else {
              f = _.last(f.split('\/'));
            }
          }
          return f;
        })
        .filter(f => {
          return !!f && f !== '.' && f !== '..' && !f.startsWith('@') && f.length > 1;
        });
    } catch (error) {
      return [];
    }
    //#endregion
  }

}
