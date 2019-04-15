import { Subscription } from 'rxjs/Subscription';
import { OnDestroy, Component, Input } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'app-base-component-meta'
})
export class BaseComponent extends FieldType implements OnDestroy {

  @Input() model: any = {};
  @Input() modelKey: string;


  handlers: Subscription[] = [];

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.handlers.length = 0;
  }


}
