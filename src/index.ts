import { execute } from './execute';
import { Strategy, getStrategy } from './startegy';

const scripts = {
    release: execute('release.sh'),
    build: execute('build.sh')
}

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




