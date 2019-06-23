// import * as _ from 'lodash';
// import { routes as baselineRoutes } from 'baseline/ss-common-ui/src/app/+preview-components/preview-components.routes';

// (() => {
//   _.first(baselineRoutes).children.push({
//     path: 'buildtnpprocess',
//     loadChildren: './components/+preview-buildtnpprocess/preview-buildtnpprocess.module#PreviewBuildTnpProcesssModule'
//   });

// })();


// export const routes = baselineRoutes;

import { Routes } from '@angular/router';
import { PreviewComponents } from './preview-components.component';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewComponents,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tablewrapper'
      },
      {
        path: 'formlyinputs',
        loadChildren: './components/+preview-formly-inputs/preview-formly-inputs.module#PreviewFormlyInputsModule'
      },
      {
        path: 'listwrapper',
        loadChildren: './components/+preview-list-wrapper/preview-list-wrapper.module#PreviewListWrapperModule'
      },
      {
        path: 'formwrapper',
        loadChildren: './components/+preview-form-wrapper/preview-form-wrapper.module#PreviewFormWrapperModule'
      },
      {
        path: 'selectwrapper',
        loadChildren: './components/+preview-select-wrapper/preview-select-wrapper.module#PreviewSelectWrapperModule'
      },
      {
        path: 'editorwrapper',
        loadChildren: './components/+preview-editor-wrapper/+preview-editor-wrapper.module#PreviewEditorWrapperModule'
      },
      {
        path: 'multimediawrapper',
        loadChildren: './components/+preview-multimedia-wrapper/preview-multimedia-wrapper.module#PreviewMultimediaWrapperModule'
      },
      {
        path: 'tablewrapper',
        loadChildren: './components/+preview-table-wrapper/preview-table-wrapper.module#PreviewTableWrapperModule'
      },
      {
        path: 'commonlogin',
        loadChildren: './components/+preview-common-login/preview-common-login.module#PreviewCommonLoginModule'
      },
      {
        path: 'logo',
        loadChildren: './components/+preview-logo/preview-logo.module#PreviewLogoModule'
      },
      {
        path: 'processlogger',
        loadChildren: './components/+preview-process-logger/preview-process-logger.module#PreviewProcessLoggerModule'
      },
      {
        path: 'buildtnpprocess',
        loadChildren: './components/+preview-buildtnpprocess/preview-buildtnpprocess.module#PreviewBuildTnpProcesssModule'
      },
      {
        path: 'modal',
        loadChildren: './components/+preview-modal/+preview-modal.module#PreviewModalModule'
      },
    ]
  }
];
