import { Injectable } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { NotificaitonModel } from './notification-model';


@Injectable()
export class NotificationsService {

  constructor(
    //#region @cutCodeIfFalse ENV.frameworks.includes('material')
    public toast: ToastrService,
    //#endregion
  ) {

  }

  success(title: string, subtitle: string) {
    const t = this.toast.success(title, subtitle, {
      easing: '300',
    });

    return new NotificaitonModel(t);

  }


}
