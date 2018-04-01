

import { build, buildApp } from "./BUILD";

export default {
    $TASK_START: () => {
        build(false, true)
        buildApp(false, true)

    }
}