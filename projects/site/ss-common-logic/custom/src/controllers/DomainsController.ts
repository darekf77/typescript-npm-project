
import { ENDPOINT, CLASSNAME, BaseCRUDEntity, META } from 'morphi';
import { DOMAIN } from '../entities/DOMAIN';

import * as entities from '../entities';
import * as controllers from '../controllers';
import { DOMAIN_ENVIRONMENT } from '../entities/DOMAIN';


@ENDPOINT()
@CLASSNAME('DomainsController')
export class DomainsController extends META.BASE_CONTROLLER<DOMAIN> {
  @BaseCRUDEntity(entities.DOMAIN) public entity: entities.DOMAIN;
  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }

  async initExampleDbData() {
    // console.log('Don not init this! OK ')

    await this.db.DOMAIN.save(this.db.DOMAIN.create({
      name: 'francuskidlamężczyzn.pl'
    }))

    await this.db.DOMAIN.save(this.db.DOMAIN.create({
      name: 'francuskidlamężczyzn.pl',
      environment: DOMAIN_ENVIRONMENT.DEV
    }))

    await this.db.DOMAIN.save(this.db.DOMAIN.create({
      name: 'francuskidlamezczyzn.pl'
    }))

    await this.db.DOMAIN.save(this.db.DOMAIN.create({
      name: 'francuskidlamezczyzn.pl',
      environment: DOMAIN_ENVIRONMENT.DEV
    }))


    await this.db.DOMAIN.save(this.db.DOMAIN.create({
      name: 'morphi.io'
    }))



  }

  //#endregion

}

export default DomainsController;
