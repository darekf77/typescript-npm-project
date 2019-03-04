

import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AppPreviewPopupContentService {

  templateChanged$ = new BehaviorSubject<TemplateRef<any>>(void 0);

  constructor() {

  }

  setContent(template: TemplateRef<any> ) {
    this.templateChanged$.next(template);
  }

}
