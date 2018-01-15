
import { getPackageJSON, install } from "./helpers";
import { PackageJSON, LibType } from "./models";
import config from "./config";

export class Project {

    constructor(public location: string) {
        this.packageJSON = getPackageJSON(location);
    }

    get type(): LibType {
        const p = this.packageJSON.tnp;
        return p.type;
    }

    get previewFolder(): string {
        return config.folder.preview(this.type);
    }

    packageJSON: PackageJSON;

    get version() {
        return this.packageJSON.version;
    }

    get resources(): string[] {
        const p = this.packageJSON.tnp;
        return Array.isArray(p.resources) ? p.resources : [];
    }

    preparePackages() {
        install.packages(this.location);
        if (this.type === 'angular-lib') {
            install.packages(this.previewFolder);
        }
    }

};