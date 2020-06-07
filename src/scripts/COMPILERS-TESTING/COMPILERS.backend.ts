import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';

const testTasks = 'Test task'



async function $COMPILER_BSJ() {
  await (Project.Current as Project).join.start(testTasks);
  process.exit(0)
}

async function $COMPILER_BSJ_WATCH() {
  await (Project.Current as Project).join.startAndWatch(testTasks);
}

async function $COMPILER_BSJ_WATCH_ONLY() {
  await (Project.Current as Project).join.startAndWatch(testTasks, { watchOnly: true });
}

async function $COMPILER_SM() {
  await (Project.Current as Project).sourceModifier.start(testTasks);
  process.exit(0)
}

async function $COMPILER_SM_WATCH() {
  await (Project.Current as Project).sourceModifier.startAndWatch(testTasks);
}

async function $COMPILER_SM_WATCH_ONLY() {
  await (Project.Current as Project).sourceModifier.startAndWatch(testTasks, { watchOnly: true });
}

async function $COMPILER_FFG() {
  console.info('FRAMEWORK FILES FGENERATOR')
  await (Project.Current as Project).frameworkFileGenerator.start(testTasks);
  process.exit(0)
}

async function $COMPILER_FFG_WATCH() {
  await (Project.Current as Project).frameworkFileGenerator.startAndWatch(testTasks);
}

async function $COMPILER_FFG_WATCH_ONLY() {
  await (Project.Current as Project).frameworkFileGenerator.startAndWatch(testTasks, { watchOnly: true });
}




export default {
  $COMPILER_FFG: Helpers.CLIWRAP($COMPILER_FFG, '$COMPILER_FFG'),
  $COMPILER_FFG_WATCH: Helpers.CLIWRAP($COMPILER_FFG_WATCH, '$COMPILER_FFG_WATCH'),
  $COMPILER_FFG_WATCH_ONLY: Helpers.CLIWRAP($COMPILER_FFG_WATCH_ONLY, '$COMPILER_FFG_WATCH_ONLY'),
  $COMPILER_BSJ: Helpers.CLIWRAP($COMPILER_BSJ, '$COMPILER_BSJ'),
  $COMPILER_BSJ_WATCH: Helpers.CLIWRAP($COMPILER_BSJ_WATCH, '$COMPILER_BSJ_WATCH'),
  $COMPILER_BSJ_WATCH_ONLY: Helpers.CLIWRAP($COMPILER_BSJ_WATCH_ONLY, '$COMPILER_BSJ_WATCH_ONLY'),
  $COMPILER_SM: Helpers.CLIWRAP($COMPILER_SM, '$COMPILER_SM'),
  $COMPILER_SM_WATCH: Helpers.CLIWRAP($COMPILER_SM_WATCH, '$COMPILER_SM_WATCH'),
  $COMPILER_SM_WATCH_ONLY: Helpers.CLIWRAP($COMPILER_SM_WATCH_ONLY, '$COMPILER_SM_WATCH_ONLY'),
}
