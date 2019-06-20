import {
  Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ViewEncapsulation, OnInit, TemplateRef
} from '@angular/core';
import { AppPreviewPopupContentService } from './app-popup-content.service';

import {
  BaseComponent
} from 'components';
import { Router, NavigationEnd } from '@angular/router';

import { Log, Level } from 'ng2-logger/browser';
import { } from 'static-columns/browser';
const log = Log.create('app.component', Level.__NOTHING)


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
        // console.log(event)
        log.i(`[popup set content] event.url`, event.url)
        log.i(`[popup set content] this.popupService.currentUrl`, this.popupService.currentUrl)
        if (event.url.slice(0, 2) !== (this.popupService.currentUrl ? this.popupService.currentUrl.slice(0, 2) : void 0)) {
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
