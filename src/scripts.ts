import { execute } from './execute';
import * as path from 'path';


export const scripts = {
    release: execute('release.sh'),
    build: execute('build.sh', {
        'DIST_INDEX': path.join(__dirname, '../configs', 'index-dist.d.ts')
    })
}
