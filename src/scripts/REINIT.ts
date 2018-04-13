import { Project } from "../project";



export default {
    $REINIT: (args) => {
        Project.Current.run(`tnp clear`).sync()
        Project.Current.run(`tnp init`).sync()
        process.exit(0)
    }
}