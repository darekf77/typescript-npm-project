import * as _ from "lodash";
import "reflect-metadata";

import { init } from 'morphi';
import { createConnection, useContainer, ConnectionOptions, Connection } from 'typeorm';
export { Connection } from 'typeorm';
import { META } from "./meta-info";

export interface IConnectionOptions {
    database: string;
    type: 'sqlite' | 'mysql';
    synchronize: boolean;
    dropSchema: boolean;
    logging: boolean;
}

export interface StartOptions {
    config: IConnectionOptions;
    host: string;
    Controllers: META.BASE_CONTROLLER[];
    Entities?: META.BASE_ENTITY[];
    MockData?: META.BASE_MOCK_DATA[];
}

export async function start(options: StartOptions) {
    const { config, host, Controllers, Entities, MockData } = options;
    const entities = _.values(Entities) as any;
    const controllers = _.values(Controllers) as any;
    config['entities'] = entities as any;
    const connection = await createConnection(config as any);

    if (_.isArray(MockData)) {
        MockData.forEach(Mock => {
            new (Mock as any)(connection);
        })
    }

    init(host).expressApp({
        controllers,
        entities,
        connection: connection as any
    });
    return {
        connection,
        config,
        entities
    };
}
