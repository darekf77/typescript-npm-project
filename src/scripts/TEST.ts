//#region @backend
import { getLinesFromFiles } from "../helpers";


export default {


    $READLAST: async (args) => {

        const argsObj: { lines: number; file: string } = require('minimist')(args.split(' '));
        const { lines = 100, file = '' } = argsObj;

        const res = await getLinesFromFiles(argsObj.file, Number(argsObj.lines));
        console.log('lines', res);
        process.exit(0)
    }

}
//#endregion
