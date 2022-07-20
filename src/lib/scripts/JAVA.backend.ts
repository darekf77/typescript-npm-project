import { crossPlatformPath } from "tnp-core";
import { Helpers } from "tnp-helpers";


async function SELECT_JAVA() {
  Helpers.clearConsole()
  const questions = (await Helpers
    .commnadOutputAsStringAsync('/usr/libexec/java_home -V', process.cwd(), false, true))
    .split('\n')
    .map(f => crossPlatformPath(f).trim())
    .filter(f => f.endsWith('Home'))
    .filter(f => {
      const [info, path] = f.split(' /');
      return (info && path);
    })
    .map(f => {
      const [info, path] = f.split(' /');
      return {
        name: info,
        value: `/${path}`
      }
    })

  const v = await Helpers.autocompleteAsk('Choose java sdk version:', questions);
  Helpers.terminal.copyText (`export JAVA_HOME=${v}`);
  Helpers.info(`press ctrl(cmd) - v  and then ENTER `);

  process.exit(0)
}

export default {
  SELECT_JAVA: Helpers.CLIWRAP(SELECT_JAVA, 'SELECT_JAVA'),
}
