import { ConnectionOptions } from "typeorm";

export interface Config {

  /**
   * Check where code comes from baseline or site
   */
  isBaseline: boolean;

  pathes: {
    backup: {
      audio: string;
      video: string;
      picture: string;
    }
  },

  /**
   * Check wheter code is minified, mangled, gzipped
   *
   * @type {Boolean}
   * @memberof Config
   */
  productionBuild: Boolean;
  /**
   * Use ahead of time compilation for angular
   *
   * @type {Boolean}
   * @memberof Config
   */
  aot: Boolean;
  /**
   * Environment name
   *
   * @type {Boolean}
   * @memberof Config
   */
  name: 'local' | 'dev' | 'stage' | 'prod';
  /**
   * Use routes from package.json and random assigned ports
   *
   * @type {Boolean}
   * @memberof Config
   */
  useRouter: () => Boolean;
  /**
   * Routes for router
   *
   * @type {{ url: string; project: string; defaultPort: string; }[]}
   * @memberof Config
   */
  routes: { url: string; project: string; localEnvPort: string; }[]
  db: ConnectionOptions;
  /**
   * Get host for package
   *
   * @memberof Config
   */
  host: (packageName: string) => string;
}


export default {} as Config;
