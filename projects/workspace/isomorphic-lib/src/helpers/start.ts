import * as _ from "lodash";
import "reflect-metadata";

import { init } from 'morphi';
import { createConnections, useContainer, ConnectionOptions, Connection } from 'typeorm';
export { Connection } from 'typeorm';
import { getConnectionOptions } from "typeorm";

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
  Controllers: Function[];
  Entities?: Function[];
  MockData?: Function[];
}

export async function start(options: StartOptions) {
  const { config, host, Controllers, Entities, MockData } = options;
  const entities = _.values(Entities) as any;
  const controllers = _.values(Controllers) as any;
  config['entities'] = entities as any;
  console.log('config', config)
  let connection = await createConnections([config] as any);
  let firstConnection = connection[0]
  if (_.isArray(MockData)) {
    MockData.forEach(Mock => {
      new (Mock as any)(firstConnection);
    })
  }

  init(host).expressApp({
    controllers,
    entities,
    connection: firstConnection as any
  });
  return {
    connection,
    config,
    entities
  };
}
