import { Strategy, getStrategy } from './startegy';
import { scripts } from './scripts';

export function run(argsv) {
    console.log('heelllloooo')
    switch (getStrategy(argsv)) {
        case Strategy.RELEASE:
            scripts.build()
            scripts.release()
            break;
        case Strategy.BUILD:
            scripts.build()
            break;
    }
}




