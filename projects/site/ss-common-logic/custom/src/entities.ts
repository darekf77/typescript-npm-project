
//// FILE GENERATED BY TNP /////
import { META } from 'morphi';

import { Entities as BaselineEntities }  from 'baseline/ss-common-logic/src/entities';
import * as baslineEntites from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';



import { BUILD, IBUILD } from './entities/BUILD';
export { BUILD, IBUILD } from './entities/BUILD';

import { DOMAIN, IDOMAIN } from './entities/DOMAIN';
export { DOMAIN, IDOMAIN } from './entities/DOMAIN';

import { ENVIRONMENT, IENVIRONMENT } from './entities/ENVIRONMENT';
export { ENVIRONMENT, IENVIRONMENT } from './entities/ENVIRONMENT';

import { TNP_PROJECT, ITNP_PROJECT } from './entities/TNP_PROJECT';
export { TNP_PROJECT, ITNP_PROJECT } from './entities/TNP_PROJECT';

export const Entities:META.BASE_ENTITY<any>[] = [
BUILD,
DOMAIN,
ENVIRONMENT,
TNP_PROJECT
].concat(BaselineEntities as any) as any;

//#region @backend


import {   BUILD_REPOSITORY } from './repositories/BUILD_REPOSITORY';
export {   BUILD_REPOSITORY } from './repositories/BUILD_REPOSITORY';

import {   DOMAIN_REPOSITORY } from './repositories/DOMAIN_REPOSITORY';
export {   DOMAIN_REPOSITORY } from './repositories/DOMAIN_REPOSITORY';



import { Repository } from "typeorm";
export { Repository } from "typeorm";
import * as _ from 'lodash'

import {  Connection } from 'morphi';

export function entities<ADDITIONAL={}>(connection?: Connection, decoratorsEntities?: ADDITIONAL) {
return _.merge(baslineEntites.entities(connection),{

BUILD: META.repositoryFrom<BUILD , BUILD_REPOSITORY>(connection, BUILD , BUILD_REPOSITORY),

DOMAIN: META.repositoryFrom<DOMAIN , DOMAIN_REPOSITORY>(connection, DOMAIN , DOMAIN_REPOSITORY),

ENVIRONMENT: META.repositoryFrom<ENVIRONMENT>(connection, ENVIRONMENT),

TNP_PROJECT: META.repositoryFrom<TNP_PROJECT>(connection, TNP_PROJECT),
}  );
}
//#endregion
