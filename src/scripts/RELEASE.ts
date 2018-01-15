
import { Project } from "../project";

export default {
    $RELEASE: Project.Current.release,
    $RELEASE_PROD: () => Project.Current.release(true),
    COPY_RESOURCES: Project.Current.bundleResources
}
