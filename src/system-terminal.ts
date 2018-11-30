//#region @backend

import { run } from './process';
export class SystemTerminal {
  public static runInNewInstance(command: string, cwd = process.cwd()) {
    if (process.platform === 'darwin') {

      return run(`osascript <<END
tell app "Terminal"
  do script "cd ${cwd} && ${command}"
end tell
END`).sync()
    }

    return run(`cd ${cwd} && gnome-terminal -e "${command}"`).sync()
  }
}
//#endregion
