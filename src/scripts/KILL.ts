
import { info, error } from "../messages";
import { run } from '../process';
import * as os from 'os';

function killall() {
  if (process.platform === 'win32') {
    run(`taskkill /F /im node.exe`).sync();
  } else {
    run(`killall -9 node`).sync();
  }
}

function killonport(args) {
  const port = parseInt(args.trim())
  console.log(`Killing process on port ${port} in progress`);
  try {

    if (os.platform() === 'linux') {
      run(`lsof -i:${port}`, { output: false }).sync()
    } else if (os.platform() === 'win32') {
      // run(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /f /pid %a`).sync()

      const pid = Number(run(`netstat -ano | findstr :${port} | grep LISTENING -m 1 |  awk '{print $NF}'`, {
        output: false
      }).sync().toString());
      if (pid === 0 || isNaN(pid)) {
        console.log(`Port ${port} is not used byt any process...`)
        process.exit(0)
      }
      console.log(`Killing process on pid: ${pid} in progress`);
      run(`tskill ${pid}`).sync();
      info(`Done`);
    } else if (os.platform() === 'darwin') {
      info('System mac osx')
      run(`lsof -P | grep ':${port}' | awk '{print $2}' | xargs kill -9 `, { output: false }).sync()
    }

    info(`Process killed on port: ${port}`)
  } catch (e) {
    error(`Problem with killing process on port ${port}:

    ${e}

    `, true)
    process.exit(0)
  }
  process.exit(0)
}


export default {
  $KILL_ON_PORT: (args: string) => {
    killonport(args);
  },
  $KILLONPORT: (args: string) => {
    killonport(args);
  },
  $KILLALL_NODE: () => {
    killall()
  },
  $KILLALLNODE: () => {
    killall()
  }

}
