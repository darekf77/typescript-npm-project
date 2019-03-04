import {
  Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ViewEncapsulation, OnInit, TemplateRef
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AppPreviewPopupContentService } from './app-popup-content.service';

import {
  BaseComponent
} from 'components';

console.log('Stuning asdasdasd');
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent extends BaseComponent implements OnInit {

  constructor(public popupService: AppPreviewPopupContentService) {
    super();
  }
  @ViewChild('container', { read: ViewContainerRef }) view;
  template: TemplateRef<any>;
  ngOnInit(): void {
    this.popupService.templateChanged$.subscribe(template => {
      this.template = template;
      this.recreateTemplate();
    });
  }

  recreateTemplate(timeout = 100) {
    if (!this.template) {
      return;
    }

    setTimeout(() => {

      if (this.view) {
        this.view.createEmbeddedView(this.template
          //   , {
          //   model: this.model,
          //   dialog: {
          //     close: () => this.onClose()
          //   }
          // }
        );

      } else {
        this.recreateTemplate(1000);
      }

    }, timeout);
  }

}
