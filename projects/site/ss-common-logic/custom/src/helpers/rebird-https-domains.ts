
import * as fse from 'fs-extra';
import * as path from 'path';
import { Project } from 'tnp-bundle';
import { killProcessByPort, run } from 'tnp-bundle';

const PORT_80 = 80;
const PORT_443 = 443;
const PORT_LETSENCRYPT = 9999;


// async (port) => {

//   if (!!ProjectWorkspace.rebird &&
//     this.env.config.name !== 'local' &&
//     _.isString(this.env.config.domain) &&
//     this.env.config.domain.trim() !== ''
//   ) {

//     const address = `http://${this.env.config.ip}:${port}`;
//     const domain = this.env.config.domain;

//     if (_.isString(domain) && domain.trim() !== '') {
//       console.log(`Activation https domain "${domain}" for address "${address}"`)
//       ProjectWorkspace.rebird.register(domain, address, (this.env.config.name === 'prod'))

//     } else {
//       warn(`Domain is missing or is invalid in config for environment: "${this.env.config.name}"
//         Your domain value: ${domain}
//       `)
//     }

//   }

// }

export interface DomainRegisterData {
  domain: string;
  address: string;
  production: boolean;
}

export class RebirdHttpsDomains {

  readonly certsPath: string;
  readonly activeDomainsPath: string;
  readonly proxy: any;


  private static _instance: RebirdHttpsDomains = null;

  public static get Instance() {
    if (this._instance === null) {
      this._instance = new RebirdHttpsDomains()
    }
    return this._instance;
  }


  private constructor() {

    killProcessByPort(PORT_80)
    killProcessByPort(PORT_LETSENCRYPT)

    this.certsPath = path.join(Project.Tnp.location, 'tmp-certs');
    this.activeDomainsPath = path.join(Project.Tnp.location, 'tmp-active-domains.json');


    run(`rimraf ${this.certsPath}`).sync();
    run(`rimraf ${this.activeDomainsPath}`).sync();

    if (fse.existsSync(this.certsPath)) {
      fse.mkdirpSync(this.certsPath)
    }
    fse.writeJSONSync(this.activeDomainsPath, [], {
      spaces: 2
    })

    this.proxy = require('redbird')({
      port: PORT_80,
      letsencrypt: {
        path: this.certsPath,
        port: PORT_LETSENCRYPT // LetsEncrypt minimal web server port for handling challenges. Routed 80->9999, no need to open 9999 in firewall. Default 3000 if not defined.
      },
      ssl: {
        http2: false,
        port: PORT_443, // SSL port used to serve registered https routes with LetsEncrypt certificate.
      }
    });

  }

  reloadDomains() {
    let domains: DomainRegisterData[] = [];
    try {
      const d = fse.readJsonSync(this.activeDomainsPath)
      domains = d;
    } catch (error) { }

    domains.forEach(({ domain, address, production }) => {
      this.register(domain, address, production);
    })

  }



  register(domain: string, address: string, production = false) {

    let domains: DomainRegisterData[] = [];
    try {
      let d = fse.readJsonSync(this.activeDomainsPath);
      domains = d;
    } catch (error) { }


    const config = {
      ssl: {
        letsencrypt: {
          email: 'darekf77@gmail.com', // Domain owner/admin email
          production, // WARNING: Only use this flag when the proxy is verified to work correctly to avoid being banned!
        }
      }
    }
    this.proxy.register(domain, address, config);

    domains.push({ domain, address, production });
    try {
      fse.writeJsonSync(this.activeDomainsPath, domains, {
        spaces: 2
      });
    } catch (error) { }

  }

  unregister(domain: string, address: string) {
    this.proxy.unregister(domain, address);
  }


}

