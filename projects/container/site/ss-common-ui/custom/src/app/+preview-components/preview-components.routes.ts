import * as _ from 'lodash';
import { routes as baselineRoutes } from 'baseline/ss-common-ui/src/app/+preview-components/preview-components.routes';

(() => {
  _.first(baselineRoutes).children.push({
    path: 'buildtnpprocess',
    loadChildren: './components/+preview-buildtnpprocess/preview-buildtnpprocess.module#PreviewBuildTnpProcesssModule'
  });

})();


export const routes = baselineRoutes;
