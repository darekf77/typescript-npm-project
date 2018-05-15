import { AngularProject } from "./project-angular";
import * as path from "path";
import * as fs from "fs";
import { EnvConfig } from "../models";

export class ProjectAngularClient extends AngularProject {

    constructor(location: string) {
        super(location);
        let pathToWorkspaceProjectEnvironment = path.join(this.parent.location, 'environment');
        if (this.parent && this.parent.type === 'workspace' && fs.existsSync(`${pathToWorkspaceProjectEnvironment}.js`)) {
            // console.log('path to search for envrionment', path.join(this.parent.location, 'environment'))
            const env: EnvConfig = require(pathToWorkspaceProjectEnvironment) as any;
            const route = env.routes.find(r => r.project === this.name);
            // console.log('route', route)
            this.defaultPort = route.localEnvPort;
        } 
    }


    protected defaultPort: number = 4300;

}


