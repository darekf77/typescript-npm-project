import { AngularProject } from "./project-angular";
import * as path from "path";
import { EnvConfig } from "../models";

export class ProjectAngularClient extends AngularProject {

    constructor(location: string) {
        super(location);
        if (this.parent && this.parent.type === 'workspace') {
            // console.log('path to search for envrionment', path.join(this.parent.location, 'environment'))
            const env: EnvConfig = require(path.join(this.parent.location, 'environment')) as any;
            const route = env.routes.find(r => r.project === this.name);
            // console.log('route', route)
            this.defaultPort = route.localEnvPort;
        }
    }


    protected defaultPort: number = 4300;

}


