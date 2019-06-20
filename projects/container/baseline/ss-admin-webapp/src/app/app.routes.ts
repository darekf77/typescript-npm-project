import { RouterModule, Route, PreloadAllModules } from '@angular/router';

export const routes: Route[] = [
  {
    path: '',
    loadChildren: './main-page/main-page.module#AppMainPageModule',
    pathMatch: 'prefix',
  },
  {
    path: 'dashboard',
    pathMatch: 'prefix',
    loadChildren: './+dashboard/dashboard.module#DashboardModule',
    // canLoad: [CanLoadDashboard]
  }
  // {
  //   path: 'test',
  //   loadChildren: './app-test/app-test.module#AppTestModule',
  //   pathMatch: 'prefix',
  // },
  // {
  //   path: '',
  //   pathMatch: 'full' ,
  //   redirectTo: 'test'
  // }
];
