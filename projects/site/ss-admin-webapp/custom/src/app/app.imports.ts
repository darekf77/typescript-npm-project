
import * as baseline from 'baseline/ss-admin-webapp/src/app/app.imports';

import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { DomainsController } from 'ss-common-logic/browser/controllers/DomainsController';

import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { DOMAIN } from 'ss-common-logic/browser/entities/DOMAIN';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';

export const moprhi = baseline.moprhi

moprhi.controllers = moprhi.controllers.concat([
  BuildController,
  DomainsController
] as any)

moprhi.entities = moprhi.entities.concat([
  BUILD,
  DOMAIN,
  TNP_PROJECT
] as any)

export const modules = baseline.modules;

