import { Project } from '../../project';
import { CLIWRAP } from '../cli-wrapper.backend';

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

async function $COMPILER_OSM() {
  await Project.Current.outputCodeModifier.start(testTasks);
  process.exit(0)
}

async function $COMPILER_OSM_WATCH() {
  await Project.Current.outputCodeModifier.startAndWatch(testTasks);
}

async function $COMPILER_FFG() {
  console.info('FRAMEWORK FILES FGENERATOR')
  await Project.Current.frameworkFileGenerator.start(testTasks);
  process.exit(0)
}

async function $COMPILER_FFG_WATCH() {
  await Project.Current.frameworkFileGenerator.startAndWatch(testTasks);
}




export default {
  $COMPILER_FFG: CLIWRAP($COMPILER_FFG, '$COMPILER_FFG'),
  $COMPILER_FFG_WATCH: CLIWRAP($COMPILER_FFG_WATCH, '$COMPILER_FFG_WATCH'),
  $COMPILER_BSJ: CLIWRAP($COMPILER_BSJ, '$COMPILER_BSJ'),
  $COMPILER_BSJ_WATCH: CLIWRAP($COMPILER_BSJ_WATCH, '$COMPILER_BSJ_WATCH'),
  $COMPILER_SM: CLIWRAP($COMPILER_SM, '$COMPILER_SM'),
  $COMPILER_SM_WATCH: CLIWRAP($COMPILER_SM_WATCH, '$COMPILER_SM_WATCH'),
  $COMPILER_OSM: CLIWRAP($COMPILER_OSM, '$COMPILER_OSM'),
  $COMPILER_OSM_WATCH: CLIWRAP($COMPILER_OSM_WATCH, '$COMPILER_OSM_WATCH'),
}
