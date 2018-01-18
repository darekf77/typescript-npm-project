import { run } from "../process";
import { info } from "../messages";

function $COMMAND(args) {
    const command = decodeURIComponent(args);
    info(`Starting command: ${command}`)
    run(decodeURIComponent(args)).sync()
    info(`Finish command: ${command}`)
    process.exit(0)
}


export default {
    $COMMAND
}