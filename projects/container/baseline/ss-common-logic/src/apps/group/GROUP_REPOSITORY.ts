//#region @backend
import { Morphi } from 'morphi';
import { GROUP } from './GROUP';

export interface GROUP_ALIASES {

  groups: string;
  group: string;

}


@Morphi.Repository(GROUP)
export class GROUP_REPOSITORY extends Morphi.Base.Repository<GROUP, GROUP_ALIASES> {


  globalAliases: (keyof GROUP_ALIASES)[] = ['group', 'groups'];


}
//#endregion
