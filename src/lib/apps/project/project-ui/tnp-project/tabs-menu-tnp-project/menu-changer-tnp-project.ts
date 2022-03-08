import type { PROJECT } from '../../../PROJECT';
import { MenuStepTnpProject } from './menu-step-tnp-project';

export class MenuChangerTnpProject {

  step: MenuStepTnpProject;
  currentStep: number;

  currentAllowedTabs() {

  }

  constructor(
    public project: PROJECT) {

    this.resolveStep()
  }

  resolveStep() {
    if (this.showDefaultStepForProject) {

    } else {

    }
  }


  private get showDefaultStepForProject(): boolean {
    // if (project.isStandaloneProject) {
    //   this.currentStep = TnpProjectTabIndex.RELEASE;
    // } else {
    //   this.project.proc
    //   if (this.project.procStaticBuild.state === 'notStarted') {
    //     this.currentStep = TnpProjectTabIndex.ENV;
    //   } else {
    //     if (this.project.procStaticBuild.state === '') {

    //     }
    //   }
    // }
    return true;
  }
}
