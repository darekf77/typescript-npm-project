

import * as _ from 'lodash';
import { describe } from 'mocha'
import { expect, use } from 'chai'
import { PortInstance } from '../tnp-db/port-instance';
import { Range } from '../helpers';

describe('Ports type spec', () => {



  it('should compare correcly simple number types', async function () {

    (() => {
      let t1 = new PortInstance(3000)
      let t2 = new PortInstance(3000)
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance(3000)
      let t2 = new PortInstance(2000)
      expect(t1.includes(t2)).to.be.false;
    })();

  });


  it('it should compare correcly array types', async function () {

    (() => {
      let t1 = new PortInstance([2000, 3000, 4000])
      let t2 = new PortInstance([2000])
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance([2000, 3000, 4000])
      let t2 = new PortInstance([5000])
      expect(t1.includes(t2)).to.be.false;
    })();

  });


  it('it should compare correcly range types', async function () {

    (() => {
      let t1 = new PortInstance(Range.from(3000).to(5000))
      let t2 = new PortInstance(Range.from(4000).to(4500))
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance(Range.from(3000).to(5000))
      let t2 = new PortInstance(Range.from(3000).to(5000))
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance(Range.from(3000).to(5000))
      let t2 = new PortInstance(Range.from(2000).to(4500))
      expect(t1.includes(t2)).to.be.false;
    })();

    (() => {
      let t1 = new PortInstance(Range.from(3000).to(5000))
      let t2 = new PortInstance(Range.from(4000).to(5500))
      expect(t1.includes(t2)).to.be.false;
    })();

    (() => {
      let t1 = new PortInstance(Range.from(3000).to(5000))
      let t2 = new PortInstance(Range.from(2000).to(5500))
      expect(t1.includes(t2)).to.be.false;
    })();


  });



});

