//#region @backend
import { EntityRepository, META } from "morphi";
import { DOMAIN } from "../entities/DOMAIN";

export interface BUILD_ALIASES {
  domain: string;
  domains: string;
}

@EntityRepository(DOMAIN)
export class DOMAIN_REPOSITORY extends META.BASE_REPOSITORY<DOMAIN, BUILD_ALIASES> {
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
