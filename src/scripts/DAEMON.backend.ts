
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { config } from '../config';

abstract class DaemonBase {

  constructor() {

  }

  async start(port?: number) {
    const db = await TnpDB.Instance(config.dbLocation);


  }

}


class DeamonTnp extends DaemonBase {

}


export async function DAEMON_TNP(args, exit = true) {
  await (new DeamonTnp()).start();
}


export default {
  DAEMON_TNP: Helpers.CLIWRAP(DAEMON_TNP, 'DAEMON_TNP'),
}
