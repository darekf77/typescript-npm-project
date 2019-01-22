import { Project } from '../project';


export default {
  CIRCURAL_CHECK() {
    Project.Current.run(`madge --circular --extensions ts ./src`).sync()
    process.exit(0)
  }
}
