import { Project } from "../../project";

function $COMPILER_JOIN_WATCH() {
  Project.Current.sourceModifier.startAndWatch(`Baseline site join watch`);
  // process.exit(0)
}

function $COMPILER_JOIN() {
  Project.Current.sourceModifier.startAndWatch(`Baseline site join`);
  // process.exit(0)
}


export default {
  $COMPILER_JOIN,
  $COMPILER_JOIN_WATCH,
}
