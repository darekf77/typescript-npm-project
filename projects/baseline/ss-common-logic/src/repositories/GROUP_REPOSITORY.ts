//#region @backend
import { EntityRepository, META } from 'morphi';
import { GROUP } from '../entities/GROUP';

export interface GROUP_ALIASES {

  groups: string;
  group: string;

}


@EntityRepository(GROUP)
export class GROUP_REPOSITORY extends META.BASE_REPOSITORY<GROUP, GROUP_ALIASES> {


  globalAliases: (keyof GROUP_ALIASES)[] = ['group', 'groups'];


}
//#endregion
