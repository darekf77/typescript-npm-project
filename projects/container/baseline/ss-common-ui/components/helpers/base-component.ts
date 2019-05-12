import { Subscription } from 'rxjs/Subscription';
import { OnDestroy, Component, Input } from '@angular/core';


@Component({
  selector: 'app-base-component-meta'
})
export abstract class BaseComponent implements OnDestroy {

  @Input() model: any = {};

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.handlers.length = 0;
  }


}
