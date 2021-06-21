import { _ } from 'tnp-core';
import { crossPlatformPath } from 'tnp-core'
import { Project } from '../project';
import * as  psList from 'ps-list';
import { CLASS } from 'typescript-class-helpers';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import chalk from 'chalk';
import { path } from 'tnp-core'
import { config } from 'tnp-config';
import * as nodemailer from 'nodemailer';
import { PackagesRecognitionExtended } from '../project/features/packages-recognition-extended';
import { RegionRemover } from '../project/compilers/build-isomorphic-lib/region-remover.backend';
import { codeCuttFn } from '../project/compilers/build-isomorphic-lib/cutCodeFn.backend';
declare const ENV: any;
// console.log('hello')

function $CONFIGS() {
  Helpers.log((Project.Current as Project).env.configsFromJs.map(c => c.domain).join('\n'));
  process.exit(0)
}

function CHECK_ENV() {
  Helpers.checkEnvironment(config.required);
  process.exit(0)
}


function recreate() {
  (Project.Current as Project).recreate.initAssets();
  (Project.Current as Project).recreate.gitignore();
  process.exit(0)

}

function version() {
  //#region @notForNpm
  if (ENV.notForNpm) {
    console.log(`I am secret project!`);
  }
  //#endregion
  !global.hideLog && console.log(`tnp location: ${Project.Tnp.location}`)
  Helpers.info((Project.Tnp as Project).version);
  process.exit(0)
}

async function RUN_PROCESS() {
  console.log(`RUNNING ON PID: ${chalk.bold(process.pid.toString())}`)
  console.log(`----------PPID: ${process.ppid}`)
  process.env['teststttt'] = '12';
  process.env['hello'] = 'world';
}


async function $PSINFO(args: string) {
  const pid = Number(args)

  let ps: Models.system.PsListInfo[] = await psList()

  let info = ps.find(p => p.pid == pid);
  if (!info) {
    Helpers.error(`No process found with pid: ${args}`, false, true)
  }
  console.log(info)
}

function $COMMAND(args) {
  const command = decodeURIComponent(args);
  // info(`Starting command: ${command}`)
  Helpers.run(decodeURIComponent(args)).sync()
  // info(`Finish command: ${command}`)
  process.exit(0)
}



function NPM_FIXES() {
  console.log((Project.Current as Project).node_modules.fixesForNodeModulesPackages)
  process.exit(0)
}


function CIRCURAL_CHECK() {
  (Project.Current as Project).run(`madge --circular --extensions ts ./src`).sync()
  process.exit(0)
}

const $FILEINFO = (args) => {
  console.log(Helpers.getMostRecentFilesNames(crossPlatformPath(process.cwd())))

  process.exit(0)
}



const PSINFO = async (a) => {
  await $PSINFO(a)
}


function $isbundlemode(args) {
  console.log('IS BUNDLE MODE? ', Project.isBundleMode)
  process.exit(0)
}

const $ASSETS = () => recreate();
const $VERSION = () => version();
const PATH = () => {
  console.log((Project.Tnp as Project).location);
  process.exit(0)
};

const COPY_RESOURCES = () => {
  (Project.Current as Project).checkIfReadyForNpm();
  (Project.Current as Project).bundleResources();
  process.exit(0)
}

const $CHECK_ENV = (args) => {
  Helpers.checkEnvironment()
  process.exit(0)
};

const $CHECK_ENVIRONMENT = (args) => {
  Helpers.checkEnvironment()
  process.exit(0)
};

function ENV_CHECK() {
  CHECK_ENV()
}


async function $AA() {
  console.log(CLASS.getBy('Project'))
}

function CROP(args: string) {
  const argv = args.split(' ');
  const replacements = [
    ['@backendFunc', `return (void 0);`],
    '@backend' as any,
    '@notForNpm',
    ['@cutCodeIfTrue', codeCuttFn(true)],
    ['@cutCodeIfFalse', codeCuttFn(false)]
  ] as Models.dev.Replacement[];
  let filePath = _.first(argv);
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath);
  }
  const rm = RegionRemover.from(filePath, Helpers.readFile(filePath), replacements, Project.Current as Project);
  const output = rm.output;
  Helpers.writeFile(path.join(process.cwd(), `output-${path.basename(filePath)}`), output);
  Helpers.info('DONE');
  process.exit(0);
}

async function $SEND_EMAIL(args: string) {
  Helpers.info('Send email');
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "darekf77@gmai.com, dariusz.filipiak@igt.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  process.exit(0);
}


export default {
  $SEND_EMAIL: Helpers.CLIWRAP($SEND_EMAIL, '$SEND_EMAIL'),
  $AA: Helpers.CLIWRAP($AA, '$AA'),
  CROP: Helpers.CLIWRAP(CROP, 'CROP'),
  NPM_FIXES: Helpers.CLIWRAP(NPM_FIXES, 'NPM_FIXES'),
  // $COPY_FROM(args: string) {
  //   const [from, to, pkgName] = args.trim().split(' ');
  //   Project.From<Project>(from).node_modules.copy(pkgName).to(Project.From<Project>(to))
  //   process.exit()
  // },
  $COMMAND: Helpers.CLIWRAP($COMMAND, '$COMMAND'),
  CIRCURAL_CHECK: Helpers.CLIWRAP(CIRCURAL_CHECK, 'CIRCURAL_CHECK'),
  $FILEINFO: Helpers.CLIWRAP($FILEINFO, '$FILEINFO'),
  RUN_PROCESS: Helpers.CLIWRAP(RUN_PROCESS, 'RUN_PROCESS'),
  PSINFO: Helpers.CLIWRAP(PSINFO, 'PSINFO'),
  $isbundlemode: Helpers.CLIWRAP($isbundlemode, '$isbundlemode'),
  $ASSETS: Helpers.CLIWRAP($ASSETS, '$ASSETS'),
  $VERSION: Helpers.CLIWRAP($VERSION, '$VERSION'),
  PATH: Helpers.CLIWRAP(PATH, 'PATH'),
  COPY_RESOURCES: Helpers.CLIWRAP(COPY_RESOURCES, 'COPY_RESOURCES'),
  $CHECK_ENV: Helpers.CLIWRAP($CHECK_ENV, '$CHECK_ENV'),
  $CHECK_ENVIRONMENT: Helpers.CLIWRAP($CHECK_ENVIRONMENT, '$CHECK_ENVIRONMENT'),
  $CONFIGS: Helpers.CLIWRAP($CONFIGS, '$CONFIGS'),
  CHECK_ENV: [Helpers.CLIWRAP(CHECK_ENV, 'CHECK_ENV'), `Sample docs`],
  ENV_CHECK: Helpers.CLIWRAP(ENV_CHECK, 'ENV_CHECK'),

}
