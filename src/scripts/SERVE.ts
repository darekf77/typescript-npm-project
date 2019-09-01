//#region @backend
import * as express from 'express';
import * as path from 'path';
import { Helpers } from '../helpers';
import { Models } from '../models';

export default {
  $SERVE: (args) => {
    const config: Models.dev.BuildServeArgsServe = require('minimist')(args.split(' '));
    if (!config.port && !config.baseUrl && !config.outDir) {
      Helpers.error(`Bad arguments for tnp serve: ${config}`)
    }
    const app = express()
    app.use(config.baseUrl, express.static(path.join(process.cwd(), config.outDir)))
    app.listen(config.port, () => {
      console.log(`tnp serve is runnning on: http://localhost:${config.port}${config.baseUrl}`)
    });
  }
}
//#endregion
