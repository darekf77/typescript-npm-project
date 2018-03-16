import { ComponentRef } from "@angular/core";

export class PopupInfo {
    popup: ComponentRef<any>;
    modal: HTMLElement;
    wrapper: HTMLElement;
    contrlPanel: HTMLElement;
    popupContent: HTMLElement;
    dragXOffset: number = 0;
    dragYOffset: number = 0;
    constructor() {
    }

}
