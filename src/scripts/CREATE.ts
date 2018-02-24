
import { run } from "../process";
import { Project } from '../project';
import { error } from "../messages";
import { ProjectIsomorphicLib } from "../project";


export default {
    $CREATE_TEMP_SRC: async (args: string) => {
        try {
            const project: ProjectIsomorphicLib = Project.Current as any;
            if (project instanceof ProjectIsomorphicLib) {
                await project.createTemporaryBrowserSrc()
            }
            process.exit(0)
        } catch (err) {
            error(err);
        }
    }
}
