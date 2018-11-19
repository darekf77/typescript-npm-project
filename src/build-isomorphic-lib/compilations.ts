//#region @backend
import { BroswerCompilation, OutFolder } from 'morphi/build';
import { ExtendedCodeCut } from './browser-code-cut';
import { EnvConfig } from '../models';




export class BroswerForModuleCompilation extends BroswerCompilation {

    constructor(private module: string,
        private ENV: EnvConfig,
        sourceOut: string,
        outFolder: OutFolder,
        location: string,
        cwd: string) {

        super(sourceOut, outFolder, location, cwd)
    }

    codeCuttFn(cutIftrue = true, e: EnvConfig) {
        return function (expression: string) {
            const res = eval(`(function(ENV){ return (${expression.trim()}); })(e)`);
            return cutIftrue ? res : !res;
        }
    }

    initCodeCut() {
        this.codecut = new ExtendedCodeCut(this.compilationFolderPath, this.filesAndFoldesRelativePathes, {
            replacements: [
                ["@backendFunc", `return undefined;`],
                "@backend",
                // ["@cutRegionIfTrue", this.codeCuttFn(true, this.ENV)],
                // ["@cutRegionIfFalse", this.codeCuttFn(false, this.ENV)]
            ]
        })
    }


}
//#endregion
