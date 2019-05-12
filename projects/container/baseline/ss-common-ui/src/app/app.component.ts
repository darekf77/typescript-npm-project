import {
  Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ViewEncapsulation, OnInit, TemplateRef
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AppPreviewPopupContentService } from './app-popup-content.service';

import {
  BaseComponent
} from 'ss-common-ui/module';
import { Router, NavigationEnd } from '@angular/router';

console.log('Stuning asdasdasd');
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent extends BaseComponent implements OnInit {

  constructor(
    public popupService: AppPreviewPopupContentService,
    private router: Router) {
    super();
  }
  @ViewChild('navEmpty') navEmpty: TemplateRef<any>;
  @ViewChild('container', { read: ViewContainerRef }) view: ViewContainerRef;
  template: TemplateRef<any>;
  ngOnInit(): void {
    this.popupService.templateChanged$.subscribe(template => {
      this.template = template;
      this.recreateTemplate();
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log(event)
        if (event.url !== this.popupService.currentUrl) {
          this.popupService.setContent(void 0, event.url)
        }
      }
    })
  }

  recreateTemplate(timeout = 100) {

    setTimeout(() => {

      if (this.view) {
        this.view.clear();

        this.view.createEmbeddedView(!!this.template ? this.template : this.navEmpty);

      } else {
        this.recreateTemplate(1000);
      }

    }, timeout);
  }

}
