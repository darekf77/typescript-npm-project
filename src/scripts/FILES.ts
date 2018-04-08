import { Project } from "../project";
import { FilesRecreator } from "../project/files-builder";
import { BaselineSiteJoin } from "../project/baseline-site-join";



export default {
    $FILES_CUSTOM: (args) => {
        console.log(new BaselineSiteJoin(Project.Current).filesFrom.customFiles)
        process.exit(0)
    },
    $FILES_BASELINE: (args) => {
        console.log(new BaselineSiteJoin(Project.Current).filesFrom.baselineFiles)
        process.exit(0)
    },
    $FILES_JOIN: (args) => {
        console.log(new BaselineSiteJoin(Project.Current).filesFrom.joinedFiles)
        process.exit(0)
    },
    $MONITOR_BASELINE_SITE: (args) => {
        new BaselineSiteJoin(Project.Current).init()
        process.stdin.resume()
    }
}