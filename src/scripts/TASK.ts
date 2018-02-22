

import { build } from "./BUILD";

export default {
    $TASK_START: () => build(false, true)
}