import { ConnectionOptions } from "typeorm";

export interface Config {

  build: {
    browser: {
      minify: boolean;
      aot: boolean;
    },
    server: {
      minify: boolean;
    }
  }

  name: 'local' | 'dev' | 'stage' | 'prod';

  routes: { url: string; project: string; localEnvPort: string; }[]

  $db: ConnectionOptions;

  port: boolean;

  host: boolean;

}


export default {} as Config;
