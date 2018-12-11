//#region @backend
import { Morphi } from 'morphi';
import { GROUP } from '../entities/GROUP';

export interface GROUP_ALIASES {

  groups: string;
  group: string;

}


@Morphi.Repository()
export class GROUP_REPOSITORY extends Morphi.Base.Repository<GROUP, GROUP_ALIASES> {


  globalAliases: (keyof GROUP_ALIASES)[] = ['group', 'groups'];


}
//#endregion
