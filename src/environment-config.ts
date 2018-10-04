import { EnvConfig } from './models';



export const config: EnvConfig = {
  workspace: {
    workspace: {
      baseUrl: '/info',
      name: 'workspace-name',
      //#region @backend
      port: 5000
      //#endregion
    },
    projects: [
      {
        baseUrl: '/some-api-endpoint',
        name: 'project-name-in-workspace',
        //#region @backend
        port: 3000
        //#endregion
      },
      {
        baseUrl: '/',
        name: 'other-example-projet-name',
        //#region @backend
        port: 4000
        //#endregion
      }
    ]
  }
}
