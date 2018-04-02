import { RouterModule, Route, PreloadAllModules } from "@angular/router";

export const routes: Route[] = [
  {
    path: '',
    loadChildren: './main-page/main-page.module#AppMainPageModule',
    pathMatch: 'prefix',
  }
  // {
  //   path: '',
  //   pathMatch: 'full' ,
  //   redirectTo: 'test'
  // }
];
