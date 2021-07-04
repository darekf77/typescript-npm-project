import { path } from 'tnp-core'
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { Project } from '../project/abstract/project';

function $UPDATE_ISOMORPHIC() {
  PackagesRecognitionExtended.fromProject((Project.Current as Project)).start(true, '[update process]');
  process.exit(0)
}

function $UPDATE(args: string) {
  Helpers.error(`Nothing here yet.`)
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
  // Helpers.info(`Update of ${file} done.`);
  // process.exit(0);
}

export default {
  $UPDATE_ISOMORPHIC: Helpers.CLIWRAP($UPDATE_ISOMORPHIC, '$UPDATE_ISOMORPHIC'),
  $UPDATE: Helpers.CLIWRAP($UPDATE, '$UPDATE'),
};

