//#region @backend
import { Range } from '../../helpers';

import { BaseController } from './base-controlller';
import { PortInstance } from '../entites/port-instance';
import { SystemService } from '../../models/system-service';
import { PortsSet } from './ports-set';

export class PortsController extends BaseController {

  public get manager() {
    return new PortsSet(this.crud.getAll(PortInstance), (newPorts) => {
      this.crud.setBulk(newPorts);
    });
  }

  async addExisted() {

    const defaultPorts: PortInstance[] = [

      new PortInstance([80, 443], new SystemService('http(s) related')),
      new PortInstance(Range.from(4000).to(6000))

    ]

    this.crud.setBulk(defaultPorts);

  }

}
//#endregion
