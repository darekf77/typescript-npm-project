import { Project } from "../project";
import { FilesRecreator } from "../project/files-builder";
import { BaselineSiteJoin } from "../project/baseline-site-join";
import { init } from "./INIT";


export default {
    $FILES_CUSTOM: (args) => {
        console.log(new BaselineSiteJoin(Project.Current).files.allCustomFiles)
        process.exit(0)
    },
    $FILES_BASELINE: (args) => {
        console.log(new BaselineSiteJoin(Project.Current).files.allBaselineFiles)
        process.exit(0)
    },
    $BASELINE_SITE_START: (args) => {
        init()
        new BaselineSiteJoin(Project.Current).init()
        process.exit(0)
    },
    $BASELINE_SITE_START_WATCH: (args) => {
        init()
        new BaselineSiteJoin(Project.Current).init().watch()
        process.stdin.resume()
    }
}