import { PathParameter } from './path-parameter';
import { getStrategy, project, error } from './helpers';
import { scripts } from './scripts';



export function run(argsv) {
    const { strategy, args } = getStrategy(argsv);
    // console.log(strategy);
    switch (strategy) {
        case PathParameter.$RELEASE:
            scripts.release()
            break;
        case PathParameter.$BUILD:
            scripts.build()
            break;
        case PathParameter.BUILD_WATCH:
            scripts.build_watch();
            break;
        case PathParameter.VERSION:
            scripts.version();
            break;
        case PathParameter.COPY_RESOURCES:
            scripts.copy_resources();
            break;
        case PathParameter.$NEW:
            scripts.new(args);
            break;
        default:
            error('Unrecognized arguments ' + args)
            process.exit(1);
    }
}



