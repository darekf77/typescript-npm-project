

export class TestService {



  onlyAdminApp() {
    //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-admin-webapp'
    console.log('I am in admin')
    //#endregion
  }


  onlyWebapp() {
    //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-webapp'
    console.log('I am in webapp')
    //#endregion
  }


  onlyCommonUI() {
     //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
     console.log('I am in common ui!')
     //#endregion
  }

}
