import { Range } from '../../helpers';

import { BaseController } from './base-controlller';
import { PortInstance } from '../entites/port-instance';
import { SystemService } from '../../models/system-service';

export class PortsController extends BaseController {
  async addExisted() {

    const defaultPorts: PortInstance[] = [

      new PortInstance([80, 443], new SystemService('http(s) related')),
      new PortInstance(Range.from(4000).to(6000))

    ]

    this.crud.setBulk(defaultPorts);

  }



}
