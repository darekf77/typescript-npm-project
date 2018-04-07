

import { buildApp, buildLib } from "./BUILD";

export default {
    $TASK_START: () => {
        buildApp(false, true)
        buildLib(false, true)
    }
}