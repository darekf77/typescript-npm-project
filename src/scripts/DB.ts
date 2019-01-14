import { initJsonDb } from '../db';



export default {
  $DB: async () => {
    await initJsonDb()
    process.exit(9)
  }
}
