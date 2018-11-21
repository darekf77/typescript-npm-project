import {
  Routes, RouterModule
} from '@angular/router';

import { DomainsEditorComponent } from './domains-editor.component';

export const routes: Routes = [
  {
      path: '',
      pathMatch: "full",
      component: DomainsEditorComponent
  }
];
