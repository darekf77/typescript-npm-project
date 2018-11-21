// import { TNP_PROJECT } from "../entities/TNP_PROJECT";
// import { EnvironmentName } from "tnp-bundle";
// import { TnpProjectController } from "../controllers/TnpProjectController";
// import { Subject } from "rxjs/Subject";
// import { Observable } from "rxjs/Observable";
// import { Log } from 'ng2-logger/browser';

// const log = Log.create('tnp project service')

// import { db } from '../db';



// class TnpProjectService {

//   public static from(model?: TNP_PROJECT, realtimeUpdae = false) {
//     return new TnpProjectService(undefined)
//   }

//   public model: TNP_PROJECT;
//   private _$model = new Subject<TNP_PROJECT>()
//   public $model = this._$model.asObservable()

//   private _$options = new Subject<EnvironmentName[]>()
//   public $options = this._$options.asObservable()


//   constructor(private ctrl: TnpProjectController) {

//   }



//   async changeEnvironment(value: EnvironmentName) {
//     log.i('environment changed to: ', value);
//     const data = await this.ctrl.changeEnvironment(this.model.id, value).received;
//     this.model.pidChangeEnvProces = data.body.json.pidChangeEnvProces;
//   }
//   async updateEnvironementNames() {

//     if (ENV.currentProjectName === 'ss-common-ui') {

//       return [
//         'dev',
//         'online',
//         'prod',
//         'stage',
//         'test'
//       ];

//     } else {
//       const data = await this.context.getEnvironmentNames(this.model.id).received;
//       return data.body.json
//     }
//   }
// }

// TnpProjectService.from(undefined)
