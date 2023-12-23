import { BuildOptions } from 'tnp-db/src';
import { Models } from 'tnp-models/src';
import { FeatureForProject } from '../../abstract/feature-for-project';
import { Project } from '../../abstract/project/project';


export class ExtensionForProject extends FeatureForProject {

  public async release(releaseOptions?: Models.dev.ReleaseOptions, automaticRelease = false) {

  }

  async build(buildOptions: BuildOptions) {

  }

}
