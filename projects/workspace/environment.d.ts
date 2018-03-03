import { ConnectionOptions } from "typeorm";

interface Config {

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
  name: Boolean;
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
}


export default {} as Config;
