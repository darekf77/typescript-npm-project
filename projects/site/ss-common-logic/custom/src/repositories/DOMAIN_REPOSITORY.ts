//#region @backend
import { Morphi} from "morphi";
import { DOMAIN } from "../entities/DOMAIN";

export interface BUILD_ALIASES {
  domain: string;
  domains: string;
}

@Morphi.Repository(DOMAIN)
export class DOMAIN_REPOSITORY extends Morphi.Base.Repository<DOMAIN, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['domain', 'domains']

  async getById(id: number) {
    const domain = await this.findOne(id);
    if (!domain) {
      throw `Cannot find domain with id ${id} `
    }
    return domain;
  }

}
//#endregion
