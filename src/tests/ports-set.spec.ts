

import * as _ from 'lodash';
import * as path from 'path';
import { describe } from 'mocha'
import { expect, use } from 'chai'
import { PortInstance } from '../tnp-db/port-instance';
import { Range } from '../helpers';
import { PortsSet } from '../tnp-db/ports-set';
import { SystemService } from '../tnp-db/system-service';
import { ProjectFrom, Project } from '../project';
import { TnpDB } from '../tnp-db/wrapper-db';

describe('Ports set tests', () => {





  it('should call save after each add', async function () {

    let saveCallCounter = 0;
    let s = new PortsSet([], () => {
      saveCallCounter++;
    })

    s.add(new PortInstance(Range.from(3000).to(4000)))
    s.add(new PortInstance(80, new SystemService('http')))
    s.add(new PortInstance([21, 22], new SystemService('System communication')))
    s.add(new PortInstance(Range.from(4100).to(4110), ProjectFrom(path.join(Project.Tnp.location, 'projects', 'baseline'))))

    expect(saveCallCounter).to.be.eq(4);
    console.log(TnpDB.prepareToSave.ports(s._ports))

  });

});
