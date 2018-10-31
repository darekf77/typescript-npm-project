
import {
    Component, OnInit, ViewContainerRef, TemplateRef,
    ComponentFactoryResolver, ViewChild, Input, AfterContentInit, ElementRef
} from '@angular/core';
import { PopupControler } from './model/popup-controller';

@Component({
    selector: 'standalone-popup',
    templateUrl: 'standalone-popup.component.html'
})

export class StandalonePopupComponent implements OnInit, AfterContentInit {
    @ViewChild('popupRoot', { read: ViewContainerRef }) parent: ViewContainerRef;

    @Input() public contentComponent: TemplateRef<any>;

    constructor(
        private viewContainerRef: ViewContainerRef,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
    }
    controller: PopupControler;
    public initPopup() {
        this.controller = new PopupControler(this.viewContainerRef, this.componentFactoryResolver);
        this.controller.setContentComponent(this.contentComponent);
        this.controller.reinitPos();
    }

    ngOnInit() {

    }

    ngAfterContentInit() {
        setTimeout(() => {
            this.initPopup();
        });
    }
}
