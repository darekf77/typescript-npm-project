//#region @backend
import { Helpers } from "morphi";


export default {
    $CHECK_ENV: (args) => {
        Helpers.checkEnvironment()
        process.exit(0)
    },
    $CHECK_ENVIRONMENT: (args) => {
        Helpers.checkEnvironment()
        process.exit(0)
    },
};
//#endregion
