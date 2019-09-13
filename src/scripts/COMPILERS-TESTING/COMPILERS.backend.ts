import { Project } from '../../project';

const testTasks = 'Test task'



async function $COMPILER_BSJ() {
  await Project.Current.join.start(testTasks);
  process.exit(0)
}

async function $COMPILER_BSJ_WATCH() {
  await Project.Current.join.startAndWatch(testTasks);
}

async function $COMPILER_SM() {
  await Project.Current.sourceModifier.start(testTasks);
  process.exit(0)
}

async function $COMPILER_SM_WATCH() {
  await Project.Current.sourceModifier.startAndWatch(testTasks);
}

async function $COMPILER_FFG() {
  await Project.Current.frameworkFileGenerator.start(testTasks);
  process.exit(0)
}

async function $COMPILER_FFG_WATCH() {
  await Project.Current.frameworkFileGenerator.startAndWatch(testTasks);
}




export default {
  $COMPILER_FFG,
  $COMPILER_FFG_WATCH,
  $COMPILER_BSJ,
  $COMPILER_BSJ_WATCH,
  $COMPILER_SM,
  $COMPILER_SM_WATCH,
}
