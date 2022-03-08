import { path } from 'tnp-core'
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { Project } from '../project/abstract/project';

function $UPDATE_ISOMORPHIC() {
  PackagesRecognitionExtended.fromProject((Project.Current as Project)).start(true, '[update process]');
  process.exit(0)
}


function $UPDATE_GLOBAL_DEPS_CACHE(args: string) {

}


function $UPDATE(args: string) {

  const morphiPathUserInUserDir = config.morphiPathUserInUserDir;
  try {
    Helpers.run(`git reset --hard && git pull origin master`,
      { cwd: morphiPathUserInUserDir }).sync()
  } catch (error) {
    Helpers.error(`[config] Not pull origin of morphi: ${config.urlMorphi} in:    ${morphiPathUserInUserDir}`);
  }

  // const file = path.basename(args.trim());
  // function processing() {
  //   Helpers.info(`processing file...`);
  // }
  // switch (file) {
  //   case config.file.tmpIsomorphicPackagesJson:
  //     processing();
  //     PackagesRecognitionExtended.fromProject((Project.Current as Project)).start(true, '[update process]');
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

