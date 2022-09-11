import { path } from 'tnp-core'
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';

import { Project } from '../project/abstract/project';
import { PackagesRecognition } from '../project/features/package-recognition/packages-recognition';

function $UPDATE_ISOMORPHIC() {
  PackagesRecognition.fromProject((Project.Current as Project)).start(true, '[update process]');
  process.exit(0)
}


function $UPDATE_GLOBAL_DEPS_CACHE(args: string) {

}


function $UPDATE(args: string) {

  if (config.frameworkName === 'firedev') {
    const morphiPathUserInUserDir = config.morphiPathUserInUserDir;
    try {
      Helpers.run(`git reset --hard && git pull origin master`,
        { cwd: morphiPathUserInUserDir }).sync()
    } catch (error) {
      Helpers.error(`[config] Not pull origin of morphi: ${config.urlMorphi} in:    ${morphiPathUserInUserDir}`);
    }
  }
  if (config.frameworkName === 'tnp') {
    Project.Tnp.run('npm i && tnp dedupe').sync();
    Project.by('container', (Project.Tnp as Project)._frameworkVersion).run('tnp i ').sync();
  }


  // const file = path.basename(args.trim());
  // function processing() {
  //   Helpers.info(`processing file...`);
  // }
  // switch (file) {
  //   case config.file.tmpIsomorphicPackagesJson:
  //     processing();
  //     PackagesRecognition.fromProject((Project.Current as Project)).start(true, '[update process]');
  //     break;
  //   default:
  //     Helpers.error(`Not recognized file for update`, false, true);
  //     break;
  // }
  Helpers.info(`Update of ${config.frameworkName} name done.`);
  process.exit(0);
}



export default {
  $UPDATE_ISOMORPHIC: Helpers.CLIWRAP($UPDATE_ISOMORPHIC, '$UPDATE_ISOMORPHIC'),
  $UPDATE: Helpers.CLIWRAP($UPDATE, '$UPDATE'),
};

