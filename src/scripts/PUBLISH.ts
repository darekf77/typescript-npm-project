
import { Project } from "../project";

export default {
    $PUBLISH: () => {
        Project.Current.publish()
        process.exit(0)
    }
}
