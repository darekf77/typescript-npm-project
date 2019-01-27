

import * as _ from 'lodash';
import * as low from 'lowdb';
import * as path from 'path';
import * as fse from 'fs-extra';
import FileSync = require('lowdb/adapters/FileSync');
import { CLASS } from 'typescript-class-helpers';

import { describe } from 'mocha'
import { expect, use } from 'chai'
import { Range } from '../helpers';
import { DBBaseEntity, PortInstance, DomainInstance, BuildInstance, CommandInstance, ProjectInstance } from '../tnp-db/entites';
import { DbCrud } from '../tnp-db/db-crud';


function db() {
  let location = path.join(__dirname, '..', '..', 'tmp-db-tests.json')
  if (fse.existsSync(location)) {
    fse.unlinkSync(location)
  }
  let adapter = new FileSync(location)
  let db = low(adapter)
  return db;
}

class TestInstance extends DBBaseEntity {


  constructor(public value: number) {
    super()
  }

  isEqual(anotherInstace: TestInstance): boolean {
    return this.value === anotherInstace.value;
  }

}


describe('Db crud', () => {




  it('should handle other types that (ports,domain,projects,commands,builds)', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(TestInstance));
    expect(entityName).to.be.eq('tests');

    let defaultValues = {};
    defaultValues[entityName] = []
    crud.clearDBandReinit(defaultValues)

    expect(crud.getAll(TestInstance).length).to.be.eq(0)

    crud.addIfNotExist(new TestInstance(1))

    expect(crud.getAll(TestInstance).length).to.be.eq(1)

  });

  it('should handle ports', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(PortInstance));
    expect(entityName).to.be.eq('ports');

    let defaultValues = {};
    defaultValues[entityName] = []
    crud.clearDBandReinit(defaultValues)

    expect(crud.getAll(PortInstance).length).to.be.eq(0)

    crud.addIfNotExist(new PortInstance(5000))

    expect(crud.getAll(PortInstance).length).to.be.eq(1)

  });



  it('should handle domains', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(DomainInstance));
    expect(entityName).to.be.eq('domains');

    let defaultValues = {};
    defaultValues[entityName] = []
    crud.clearDBandReinit(defaultValues)

    expect(crud.getAll(DomainInstance).length).to.be.eq(0)

    crud.addIfNotExist(new DomainInstance('onet.pl'))

    expect(crud.getAll(DomainInstance).length).to.be.eq(1)

  });


  it('should handle builds', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(BuildInstance));
    expect(entityName).to.be.eq('builds');

    let defaultValues = {};
    defaultValues[entityName] = []
    crud.clearDBandReinit(defaultValues)

    expect(crud.getAll(BuildInstance).length).to.be.eq(0)

    crud.addIfNotExist(new BuildInstance())

    expect(crud.getAll(BuildInstance).length).to.be.eq(1)

  });


  it('should handle commands', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(CommandInstance));
    expect(entityName).to.be.eq('commands');

    let defaultValues = {};
    defaultValues[entityName] = []
    crud.clearDBandReinit(defaultValues)

    expect(crud.getAll(CommandInstance).length).to.be.eq(0)

    crud.addIfNotExist(new CommandInstance())

    expect(crud.getAll(CommandInstance).length).to.be.eq(1)

  });


  it('should handle projects', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(ProjectInstance));
    expect(entityName).to.be.eq('projects');

    let defaultValues = {};
    defaultValues[entityName] = []
    crud.clearDBandReinit(defaultValues)

    expect(crud.getAll(ProjectInstance).length).to.be.eq(0)

    crud.addIfNotExist(new ProjectInstance())

    expect(crud.getAll(ProjectInstance).length).to.be.eq(1)

  });



});
