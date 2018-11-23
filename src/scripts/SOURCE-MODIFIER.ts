import { Project } from '../project/base-project';

export default {

  $SOURCE_MODIFIER: () => {
    Project.Current.sourceModifier.run()
  }

}
