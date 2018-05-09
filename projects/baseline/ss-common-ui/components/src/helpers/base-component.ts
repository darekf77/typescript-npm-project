import { Subscription } from 'rxjs/Subscription';
import { OnDestroy } from '@angular/core';


export class BaseComponent implements OnDestroy {

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }


}
