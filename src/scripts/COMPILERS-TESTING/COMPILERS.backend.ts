import { Project } from "../../project";

const testTasks = 'Test task'

function $COMPILER_BSJ_WATCH() {
  Project.Current.join.startAndWatch(testTasks);
  // process.exit(0)
}

function $COMPILER_BSJ() {
  Project.Current.join.startAndWatch(testTasks);
  // process.exit(0)
}

function $COMPILER_SM_WATCH() {
  Project.Current.sourceModifier.startAndWatch(testTasks);
  // process.exit(0)
}

function $COMPILER_SM() {
  Project.Current.sourceModifier.startAndWatch(testTasks);
  // process.exit(0)
}


function $COMPILER_FFG_WATCH() {
  Project.Current.frameworkFileGenerator.startAndWatch(testTasks);
  // process.exit(0)
}

function $COMPILER_FFG() {
  Project.Current.frameworkFileGenerator.startAndWatch(testTasks);
  // process.exit(0)
}


export default {
  $COMPILER_FFG,
  $COMPILER_FFG_WATCH,
  $COMPILER_BSJ,
  $COMPILER_BSJ_WATCH,
  $COMPILER_SM,
  $COMPILER_SM_WATCH,
}
