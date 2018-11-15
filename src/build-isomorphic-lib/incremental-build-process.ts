
import * as path from 'path';
import { BroswerForModuleCompilation } from './compilations';
import { IncrementalBuildProcess, OutFolder } from 'morphi/build';
import config from '../config';
import { Project } from '../project';
import { BuildOptions } from '../models';

export class IncrementalBuildProcessExtended extends IncrementalBuildProcess {



    private get resolveModulesLocations(): string[] {
        throw 'Implement this'
    }


    constructor(private project: Project, buildOptions: BuildOptions) {

        super(buildOptions.outDir, config.folder.src, project.location);

        const outFolder = buildOptions.outDir;
        const location = config.folder.src;
        const cwd = project.location;

        // this.resolveModulesLocations
        //     .forEach(moduleName => {                
        //         let browserOutFolder = `${config.folder.browser}-for-${moduleName}`
        //         if (outFolder === 'bundle') {
        //             browserOutFolder = path.join(outFolder, browserOutFolder);
        //         }

        //         this.browserCompilations.push(
        //             new BroswerForModuleCompilation(moduleName,
        //                 this.project.env.config,
        //                 `tmp-src-${outFolder}-${browserOutFolder}`,
        //                 browserOutFolder as any,
        //                 location,
        //                 cwd)
        //         )
        //     })

    }



}

