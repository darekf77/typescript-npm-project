
import { Project } from "../project";

export default {
    $RELEASE: () => {
        Project.Current.release()
        process.exit(0)
    },
    $RELEASE_PROD: () => {
        Project.Current.release(true)
        process.exit(0)
    },
    COPY_RESOURCES: () => {
        Project.Current.bundleResources()
        process.exit(0)
    }
}
