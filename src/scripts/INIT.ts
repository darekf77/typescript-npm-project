
import { Project } from "../project";

export default {
    $INIT: (args) => {
        Project.Current.recreate.commonFiles();
        Project.Current.recreate.projectSpecyficFiles();
        process.exit(0)
    }
}