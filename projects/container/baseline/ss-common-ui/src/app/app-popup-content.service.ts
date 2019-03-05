

import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationEnd } from '@angular/router';

@Injectable()
export class AppPreviewPopupContentService {

  constructor(private router: Router) {

  }

  currentUrl: string;
  templateChanged$ = new BehaviorSubject<TemplateRef<any>>(void 0);


  setContent(template: TemplateRef<any>, url?: string) {
    this.currentUrl = url;
    this.templateChanged$.next(template);
  }

}
