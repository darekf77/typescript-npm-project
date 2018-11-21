import {
  Routes, RouterModule
} from '@angular/router';

import { BuildEditorComponent } from './build-editor.component';

export const routes: Routes = [
  {
      path: '',
      pathMatch: "full",
      component: BuildEditorComponent
  }
];
