import { Subscription } from 'rxjs/Subscription';
import { OnDestroy } from '@angular/core';


export abstract class BaseComponent implements OnDestroy {

    ngOnDestroy(): void {
        this.handlers.forEach(h => h.unsubscribe())
    }
    handlers: Subscription[] = [];

}