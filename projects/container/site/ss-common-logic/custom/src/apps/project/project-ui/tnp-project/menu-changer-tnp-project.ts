import { TnpProjectTabIndex } from "./project-tab-index";
import { PROJECT } from "../../PROJECT";



export class MenuChangerTnpProject {

  currentStep: number;

  currentAllowedTabs() {

  }

  constructor(
    public project: PROJECT) {

    if (project.isStandaloneProject) {
      this.currentStep = TnpProjectTabIndex.RELEASE;
    } else {
      this.project.proc
      if (this.project.procStaticBuild.state === 'notStarted') {
        this.currentStep = TnpProjectTabIndex.ENV;
      } else {
        if (this.project.procStaticBuild.state === '') {

        }
      }
    }
  }





}
