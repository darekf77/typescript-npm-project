
import { PopupInfo } from "./popup-info";
import { ViewContainerRef, ComponentFactoryResolver, ComponentRef } from "@angular/core";
import { PopupComponent } from "../popup.component";
import { HTMLElementUtil } from "./html-utls";

export class PopupControler {
    private bodyHtml: HTMLElement;


    modalZIndex: number = 10000;
    popupQueue: PopupInfo[] = [];
    constructor(private viewContainerRef: ViewContainerRef,
        private componentFactoryResolver: ComponentFactoryResolver) {

    }
   
    PopupComponent = (component: any): ComponentRef<any> => {

        var pInfo: PopupInfo = new PopupInfo();
        const popupFactory = this.componentFactoryResolver.resolveComponentFactory(PopupComponent);
        const popupRef = this.viewContainerRef.createComponent(popupFactory)
        if (this.bodyHtml == null)
            this.bodyHtml = this.getBody(popupRef.location.nativeElement);
        pInfo.popup = popupRef;
        this.findPopupWrapperAndContent(pInfo.popup.location.nativeElement, pInfo);
        //Move the wrapper to the body tag
        HTMLElementUtil.RemoveElement(pInfo.popup.location.nativeElement);

        this.bodyHtml.appendChild(pInfo.popup.location.nativeElement);

        const popup = this.componentFactoryResolver.resolveComponentFactory(component);
        var ComponentRef = this.viewContainerRef.createComponent(popup) as ComponentRef<any>;

        HTMLElementUtil.RemoveElement(ComponentRef.location.nativeElement);

        pInfo.popupContent.appendChild(ComponentRef.location.nativeElement);
        this.popupQueue.push(pInfo);
        this.centerPositioning(pInfo.wrapper);
        return popupRef;
    }
    public close = () => {
        if (this.popupQueue.length > 0) {
            var popup = this.popupQueue.pop();
            HTMLElementUtil.RemoveElement(popup.popup.location.nativeElement);
        }

    }

    public StartDragAt = (startX: number, startY: number) => {
        var popup = this.popupQueue[this.popupQueue.length - 1];

        var top: number = + popup.wrapper.style.top.replace("px", "");
        var left: number = + popup.wrapper.style.left.replace("px", "");
        popup.dragYOffset = startY - top;
        popup.dragXOffset = startX - left;
    }
    public moveTo = (x: number, y: number) => {
        var popup = this.popupQueue[this.popupQueue.length - 1];

        popup.wrapper.style.top = (y - popup.dragYOffset) + "px";
        popup.wrapper.style.left = (x - popup.dragXOffset) + "px";
    }
    private findPopupWrapperAndContent = (popup: HTMLElement, popupInfo: PopupInfo) => {

        for (var i = 0; i < popup.children.length; ++i) {
            var c = popup.children[i] as HTMLElement;

            if (c != null) {
                switch (c.className) {
                    case "popup-modal":
                        popupInfo.modal = c;
                        break;
                    case "popup-wrapper":
                        popupInfo.wrapper = c;
                        break;
                    case "popup-controlPanel":
                        popupInfo.contrlPanel = c;
                        break;
                    case "popup-content":
                        popupInfo.popupContent = c;
                        break;

                }
                this.findPopupWrapperAndContent(c, popupInfo);
            }
        }

    }
    private centerPositioning = (wrapper: HTMLElement): HTMLElement => {

        if (wrapper != null) {
            var modal: HTMLElement = wrapper.parentElement;
            var left: number = ((modal.clientWidth - wrapper.clientWidth) / 2) | 0;
            var top: number = ((modal.clientHeight - wrapper.clientHeight) / 2) | 0;
            wrapper.style.top = top + "px";
            wrapper.style.left = left + "px";
            var y = wrapper.clientTop;
            var x = wrapper.clientTop;


        }
        return wrapper;
    }
    private getBody = (fromEl: HTMLElement): HTMLElement => {
        var b: HTMLElement = fromEl;
        do {
            b = b.parentElement;
        } while (b.tagName != "BODY")
        return b;

    }
}

