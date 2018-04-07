
import { Project, BaseProjectLib } from "../project";

export default {
    $PUBLISH: () => {
        (Project.Current as BaseProjectLib).publish()
        process.exit(0)
    }
}
