import { ActiveToast } from 'ngx-toastr';

import { Observable } from 'rxjs/Observable';
export class NotificaitonModel {

  constructor(private data: ActiveToast<any>) {

  }

  get onTap() {
    return this.data.onTap;
  }

  close() {
    this.data.toastRef.close();
  }

}
