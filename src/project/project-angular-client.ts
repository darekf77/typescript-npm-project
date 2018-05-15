import { AngularProject } from "./project-angular";
import * as path from "path";
import * as fs from "fs";
import { EnvConfig } from "../models";

export class ProjectAngularClient extends AngularProject {

    protected defaultPort: number = 4300;

}


