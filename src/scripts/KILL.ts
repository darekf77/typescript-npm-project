import { Project } from "../project";
import { info, error } from "../messages";



export default {
    $KILL_ON_PORT: (args: string) => {
        try {
            const port = parseInt(args.trim())
            Project.Current.run(`lsof -P | grep ':${port}' | awk '{print $2}'`, { output: false }).sync()
            info(`Process killed on port: ${port}`)
        } catch (e) {
            error(`Incorrect port: ${args}`)
        }
        process.exit(0)
    }

}
