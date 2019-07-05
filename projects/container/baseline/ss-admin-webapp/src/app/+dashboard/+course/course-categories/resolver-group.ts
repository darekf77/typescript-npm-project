import { Injectable } from '@angular/core';
import {
  Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, Resolve
} from '@angular/router';

import { McBreadcrumbsResolver, IBreadcrumb } from 'ngx-breadcrumbs';
import { GROUP } from 'ss-common-logic/src/apps/group/GROUP';
import { GroupsController } from 'ss-common-logic/src/apps/group/GroupsController';
import { AuthController } from 'ss-common-logic/src/apps/auth/AuthController';

@Injectable()
export class GroupResolver implements Resolve<GROUP> {


  constructor(
    private groupCRUD: GroupsController,
    private auth: AuthController) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return new Promise<GROUP>(async (resolve, reject) => {
      this.auth.browser.init(false)
      const id = Number(route.paramMap.get('groupid'))
      const group = await this.groupCRUD.getBy(id).received;
      resolve(group.body.json)
    });
  }
}
