
import { Helpers } from 'tnp-helpers';


abstract class DaemonBase {

  constructor() {

  }

  async start(port?: number) {

  }

}


class DeamonTnp extends DaemonBase {

}


export async function DAEMON_TNP(args, exit = true) {

}


export default {
  DAEMON_TNP: Helpers.CLIWRAP(DAEMON_TNP, 'DAEMON_TNP'),
}
