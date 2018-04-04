
import { WatchNoRace } from "../watcher-no-race";



export default {
    $WATCHERS_SHOW: async (args) => {
        await WatchNoRace.Instance.showProceses()
    }
}