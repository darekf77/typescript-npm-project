import { path } from 'tnp-core'
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { Project } from '../project/abstract/project';


function $UPDATE(args: string) {

  const file = path.basename(args.trim());
  function processing() {
    Helpers.info(`processing file...`);
  }
  switch (file) {
    case config.file.tmpIsomorphicPackagesJson:
      processing();
      PackagesRecognitionExtended.fromProject((Project.Current as Project)).start(true);
      break;
    default:
      Helpers.error(`Not recognized file for update`, false, true);
      break;
  }
  Helpers.info(`Update of ${file} done.`);
  process.exit(0);
}

export default {
  $UPDATE: Helpers.CLIWRAP($UPDATE, '$UPDATE'),
}
