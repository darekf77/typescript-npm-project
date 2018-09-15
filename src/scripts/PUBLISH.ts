//#region @backend
import { Project, BaseProjectLib } from "../project";

export default {
    $PUBLISH: () => {
        Project.Current.checkIfReadyForNpm();
        (Project.Current as BaseProjectLib).publish()
        process.exit(0)
    }
}
//#endregion
