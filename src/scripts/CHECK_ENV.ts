//#region @backend
import { HelpersBackend } from "morphi";


export default {
    $CHECK_ENV: (args) => {
        HelpersBackend.checkEnvironment()
        process.exit(0)
    },
    $CHECK_ENVIRONMENT: (args) => {
        HelpersBackend.checkEnvironment()
        process.exit(0)
    },
};
//#endregion
