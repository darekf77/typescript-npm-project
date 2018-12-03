import { Subscription } from 'rxjs/Subscription';
import { OnDestroy, Component } from '@angular/core';


@Component({
  selector: 'app-base-component-meta'
})
export class BaseComponent implements OnDestroy {

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }


}
