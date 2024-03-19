import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../../cli";

class $CI extends CommandLineFeature {
  public _() {
    console.log('hello world', { args: this.args, params: this.params });

    this.exit()
  }

  build() {
    console.log('hello world ci build', { args: this.args, params: this.params });

    this.exit()
  }

  start() {
    console.log('hello world ci start', { args: this.args, params: this.params });
    this.exit()
  }

}

export default {
  $CI: Helpers.CLIWRAP($CI, '$CI'),
}
