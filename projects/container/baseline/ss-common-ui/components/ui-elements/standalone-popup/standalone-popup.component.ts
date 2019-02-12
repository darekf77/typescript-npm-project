
import {
  Component, OnInit, ViewContainerRef, TemplateRef,
  ComponentFactoryResolver, ViewChild, Input, EventEmitter,
  AfterContentInit, ElementRef, Output, OnDestroy
} from '@angular/core';
import { PopupControler } from './model/popup-controller';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'standalone-popup',
  templateUrl: 'standalone-popup.component.html'
})

export class StandalonePopupComponent implements OnInit, AfterContentInit, OnDestroy {
  @ViewChild('popupRoot', { read: ViewContainerRef }) parent: ViewContainerRef;

  @Input() public contentComponent: TemplateRef<any>;

  @Input() public id: string;
  @Input() public title = ''

  @Output() public close = new EventEmitter();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
  }
  controller: PopupControler;
  handlers: Subscription[] = [];
  public initPopup() {
    this.controller = new PopupControler(this.viewContainerRef,
      this.componentFactoryResolver,
      this.id,
      this.title);
    this.controller.setContentComponent(this.contentComponent);
    this.controller.reinitPos();
    this.controller.onClose = this.close;
  }

  ngOnInit() {

  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.initPopup();
    });
  }

  ngOnDestroy() {
    this.handlers.forEach(h => h.unsubscribe());
  }


}
