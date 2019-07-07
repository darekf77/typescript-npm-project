
import * as baseline from 'baseline/ss-admin-webapp/src/app/app.imports';

import { BuildController } from 'ss-common-logic/src/controllers/BuildController';
import { DomainsController } from 'ss-common-logic/src/controllers/DomainsController';
import { TnpProjectController } from 'ss-common-logic/src/controllers/TnpProjectController';

import { BUILD } from 'ss-common-logic/src/entities/BUILD';
import { DOMAIN } from 'ss-common-logic/src/entities/DOMAIN';
import { TNP_PROJECT } from 'ss-common-logic/src/entities/TNP_PROJECT';


export const moprhi = baseline.moprhi

moprhi.controllers = moprhi.controllers.concat([
  BuildController,
  DomainsController,
  TnpProjectController
] as any)

moprhi.entities = moprhi.entities.concat([
  BUILD,
  DOMAIN,
  TNP_PROJECT
] as any)

export const modules = baseline.modules;

