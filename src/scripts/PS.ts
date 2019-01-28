//#region @backend
import * as  psList from 'ps-list';
import { PsListInfo } from '../models/ps-info';
import { error } from '../messages';

export async function $PSINFO(args: string) {
  const pid = Number(args)

  let ps: PsListInfo[] = await psList()

  let info = ps.find(p => p.pid == pid);
  if (!info) {
    error(`No process found with pid: ${args}`, false, true)
  }
  console.log(info)
}

export default {
  PSINFO: async (a) => {
    await $PSINFO(a)
  }
}
//#endregion
