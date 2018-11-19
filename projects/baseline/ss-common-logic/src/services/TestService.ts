

export class TestService {



  onlyAdminApp() {
    //#region @cutRegionIfTrue ENV.currentProjectName === 'ss-admin-webapp'
    console.log('I am in admin')
    //#endregion
  }


  onlyWebapp() {
    //#region @cutRegionIfTrue ENV.currentProjectName === 'ss-webapp'
    console.log('I am in webapp')
    //#endregion
  }


  onlyCommonUI() {
     //#region @cutRegionIfTrue ENV.currentProjectName === 'ss-common-ui'
     console.log('I am in common ui!')
     //#endregion
  }

}
