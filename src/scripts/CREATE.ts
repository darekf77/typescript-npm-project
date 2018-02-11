
import { run } from "../process";
import { Project, BUILD_ISOMORPHIC_LIB_WEBPACK } from '../project';
import { error } from "../messages";


export default {
    $CREATE_TEMP_SRC: async (args: string) => {
        try {
            await Project.Current.filesRecreation.createTemporaryBrowserSrc()
            process.exit(0)
        } catch (err) {
            error(err);
        }
    }
}
