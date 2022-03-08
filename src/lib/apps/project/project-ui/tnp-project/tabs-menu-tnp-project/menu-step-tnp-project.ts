import { TnpProjectTabIndex } from './project-tab-index';
import { TemplateRef } from '@angular/core';

export class MenuStepTnpProject {

  static All = {} as any;


  private static init = (() => {

    MenuStepTnpProject.All[TnpProjectTabIndex.ENV] = new MenuStepTnpProject(
      `Environment`,
      TnpProjectTabIndex.ENV
    );

    MenuStepTnpProject.All[TnpProjectTabIndex.BUILD] = new MenuStepTnpProject(
      `Build`,
      TnpProjectTabIndex.BUILD
    );

    MenuStepTnpProject.All[TnpProjectTabIndex.RELEASE] = new MenuStepTnpProject(
      `Release`,
      TnpProjectTabIndex.RELEASE
    );

    MenuStepTnpProject.All[TnpProjectTabIndex.SERVE] = new MenuStepTnpProject(
      `Serve`,
      TnpProjectTabIndex.SERVE
    );

    MenuStepTnpProject.All[TnpProjectTabIndex.TEST] = new MenuStepTnpProject(
      `Test`,
      TnpProjectTabIndex.TEST
    );


  })()

  constructor(
    public name: any,
    public index: TnpProjectTabIndex,
    public template?: TemplateRef<any>
  ) {

  }

}