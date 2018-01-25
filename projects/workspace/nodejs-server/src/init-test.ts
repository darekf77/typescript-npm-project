import { start, IConnectionOptions, Connection } from "../src/index";
export { start, IConnectionOptions } from "../src/index";

export async function init() {
    return await start({
        database: 'tmp/db.tests.sqlite3',
        type: 'sqlite',
        synchronize: true,
        dropSchema: true,
        logging: false
    }, 'http://localhost:4001')
}

