//#region @backend
import * as express from 'express';
import * as path from 'path';
import { error } from '../messages';
import { BuildServeArgsServe } from '../models/build-args-serve';



export default {
    $SERVE: (args) => {
        const config: BuildServeArgsServe = require('minimist')(args.split(' '));
        if (!config.port && !config.baseUrl && !config.outDir) {
            error(`Bad arguments for tnp serve: ${config}`)
        }
        const app = express()
        app.use(config.baseUrl, express.static(path.join(process.cwd(), config.outDir)))
        app.listen(config.port, () => {
            console.log(`tnp serve is runnning on: http://localhost:${config.port}${config.baseUrl}`)
        });
    }
}
//#endregion
