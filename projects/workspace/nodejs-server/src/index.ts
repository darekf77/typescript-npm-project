console.log('heeloa')
import * as path from 'path';
import * as _ from "lodash";
import "reflect-metadata";
import { init } from 'isomorphic-rest';
import { createConnection, useContainer, ConnectionOptions, Connection } from 'typeorm';
export { Connection } from 'typeorm';

import { Controllers, Entities } from 'isomorphic-lib';
import { MockData } from './db-scripts';

export interface IConnectionOptions {
    entities?: Function[],
    database: string;
    type: 'sqlite' | 'mysql',
    synchronize: boolean;
    dropSchema: boolean;
    logging: boolean;
}

export async function start(config: IConnectionOptions, host: string) {
    const entities = _.values(Entities) as any;
    const controllers = _.values(Controllers) as any;
    config.entities = entities as any;
    const connection = await createConnection(config as any);

    console.log('connection sucessfull!!!!!!!!');
    new MockData(connection);

    init(host).expressApp({
        controllers,
        entities,
        connection: connection as any
    });
    return {
        connection,
        config,
        entities
    }
}
start({
    database: 'tmp/db.sqlite3',
    type: 'sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
}, 'http://localhost:4000');
