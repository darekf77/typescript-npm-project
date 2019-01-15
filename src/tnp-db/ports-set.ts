//#region @backend
import { PortInstance } from './port-instance';
import * as _ from 'lodash';
import { Project } from '../project/base-project';
import { SystemService } from './system-service';
import { Range } from '../helpers'



export class PortsSet {

  private ports: PortInstance[];
  constructor(ports: PortInstance[], private saveCallback: (ports: PortInstance[]) => void) {
    this.ports = _.cloneDeep(ports).map(c => _.merge(new PortInstance(), c));
  }

  private reorder() {
    this.ports = _.sortBy(this.ports, (o: PortInstance) => o.sortIndex)
  }

  getFree(howManyPorts = 1): PortInstance[] {
    const freeInstances: PortInstance[] = [];
    let allInstaces: PortInstance[] = [];
    this.ports.forEach((ins) => {
      const { isFree, id, includes, size, reservedFor } = ins;
      if (size === 1) {
        allInstaces.push(ins);
      } else {
        if (_.isArray(id)) {
          id.forEach(idelem => {
            allInstaces.push(new PortInstance(idelem, reservedFor))
          })
        } else {
          const rangeID = id as Range;
          allInstaces = allInstaces.concat(rangeID.array.map(idelem => {
            return new PortInstance(idelem, reservedFor)
          }));
        }
      }
    });

    this.ports.forEach(({ isFree, id, includes, size }) => {
      if (freeInstances.length < howManyPorts) {
        if (isFree) {

        }
      }

    })

    return []
  }

  update(port: PortInstance): boolean {
    const ins = this.ports.find(f => f.isEqual(port));
    if (!ins) {
      return false;
    }
    _.merge(ins, port);
    this.saveCallback(this.ports)
    return true;
  }

  remove(port: PortInstance) {
    this.ports = this.ports.filter(f => f.isEqual(port));
    this.saveCallback(this.ports)
  }

  add(port: PortInstance): boolean {
    if (this.ports.filter(p => p.includes(port)).length > 0) {
      return false;
    }
    this.ports.push(port)
    this.reorder()
    this.saveCallback(this.ports)
    return true;
  }

}

//#endregion
