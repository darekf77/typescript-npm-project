import { PathParameter } from './path-parameter';
import { getStrategy } from './helpers';
import { scripts } from './scripts';



export function run(argsv) {
    const { strategy, args } = getStrategy(argsv);
    switch (strategy) {
        case PathParameter.RELEASE:
            scripts.build()
            scripts.release()
            break;
        case PathParameter.BUILD:
            scripts.build()
            break;
        case PathParameter.VERSION:
            scripts.version();
        case PathParameter.$NEW:
            scripts.new(args);
    }
}



