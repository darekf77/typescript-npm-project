import { PathParameter } from './path-parameter';
import { getStrategy, project, error } from './helpers';
import { scripts } from './scripts';
import { existsSync } from 'fs-extra';



export function run(argsv) {
    const { strategy, args } = getStrategy(argsv);
    // console.log(strategy);
    switch (strategy) {

        case PathParameter.VERSION:
            scripts.version();
            break;
        case PathParameter.COPY_RESOURCES:
            scripts.copy_resources();
            break;
        case PathParameter.$NEW:
            scripts.new(args);
            break;

        //#region release
        case PathParameter.$RELEASE:
            scripts.release()
            break;
        case PathParameter.$RELEASE_PROD:
            scripts.release(true)
            break;
        //#endregion

        //#region build
        case PathParameter.$BUILD:
            scripts.build()
            break;
        case PathParameter.$BUILD_PROD:
            scripts.build(true)
            break;
        case PathParameter.BUILD_WATCH:
            scripts.build_watch();
            break;
        //#endregion

        //#region clear/clean
        case PathParameter.$CLEAN:
            scripts.clear()
            break;
        case PathParameter.$CLEAN_ALL:
            scripts.clear_all()
            break;
        case PathParameter.$CLEAR:
            scripts.clear()
            break;
        case PathParameter.$CLEAR_ALL:
            scripts.clear_all()
            break;
        //#endregion

        default:
            error('Unrecognized arguments ' + args)
            process.exit(1);
    }
}



