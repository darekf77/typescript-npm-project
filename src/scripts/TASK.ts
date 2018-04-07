

import { buildApp } from "./BUILD";

export default {
    $TASK_START: () => {
        buildApp(false, true)
    }
}