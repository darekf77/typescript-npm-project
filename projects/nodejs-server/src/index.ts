console.log('heeloa')
import * as path from 'path';
import * as _ from "lodash";
import "reflect-metadata";
import { init } from 'isomorphic-rest';
import { createConnection, useContainer } from 'typeorm';

import { Controllers, Entities } from 'isomorphic-lib';
import { MockData } from './db-scripts';
export async function start() {
    const connection = await createConnection({
        database: 'db.sqlite3',
        entities: _.values(Entities),
        type: 'sqlite',
        synchronize: true,
        dropSchema: true,
        logging: false
    });


    console.log('connection sucessfull');
    new MockData(connection);

    init('http://localhost:4000').expressApp({
        controllers: _.values(Controllers),
        entities: _.values(Entities),
        connection: connection as any
    });
}
start();
