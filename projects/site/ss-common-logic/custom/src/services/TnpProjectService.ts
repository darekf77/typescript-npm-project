import { TNP_PROJECT } from "../entities/TNP_PROJECT";
import { EnvironmentName } from "tnp-bundle";
import { TnpProjectController } from "../controllers/TnpProjectController";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";


// export class BASE_SERVICE<T = Object, S= any> {



// }

class TnpProjectService {

    public static from(model?: TNP_PROJECT, realtimeUpdae = false) {
        return new TnpProjectService(undefined)
    }

    public model: TNP_PROJECT;
    private _$model = new Subject<TNP_PROJECT>()
    public $model = this._$model.asObservable()

    private _$options = new Subject<EnvironmentName[]>()
    public $options = this._$options.asObservable()


    constructor(private context: TnpProjectController) {
        // super()
    }
    // private subject = new Subject<entities.TNP_PROJECT>();
    // public $model = this.subject.asObservable()

    async updateEnvironementNames() {

        if (ENV.currentProjectName === 'ss-common-ui') {

            return [
                'dev',
                'online',
                'prod',
                'stage',
                'test'
            ];

        } else {
            const data = await this.context.getEnvironmentNames(this.model.id).received;
            return data.body.json
        }
    }
}

TnpProjectService.from(undefined)