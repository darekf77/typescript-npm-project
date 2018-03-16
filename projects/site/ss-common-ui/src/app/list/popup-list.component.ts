import { Component } from '@angular/core';
import { AppComponent } from '../app.component';


@Component(
    {
        selector: 'popup-list',
        templateUrl:'popup-list.component.html',
        styleUrls: [ 'popup-list.component.scss' ]
    }
)
export class PopupDemo {

    constructor() {

    }
    popup = () => {
        AppComponent.PopupControler.PopupComponent(PopupDemo);
    }
}

