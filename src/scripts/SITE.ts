import { Project } from "../project";
import { error } from "../messages";
import { build } from "./BUILD";

export function buildFromBaseline(prod = false) {
    if (Project.Current.baseline) {
        // Project.Current.baseline.filesRecreation.baselineSourceforSite(Project.Current);
        build(prod, false)
    } else {
        error(`This project "${Project.Current}" is not based on baseline:
        
        In package json, include baseline linke this:

        ...
        {
            tnp: {
                ...
                "basedOn", "<path to baseline project>"
                ...
            }
        }
        ...
        `)

    }

}



export default {

    $BUILD_FROM_BASELINE: (args) => {

    },
    $BUILD_FROM_BASELINE_WATCH: (args) => {

    }

}