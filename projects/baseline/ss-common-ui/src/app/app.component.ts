import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BarService } from 'components';
import { PopupControler } from './popup/model/popup-controller';
import { PopupDemo } from './list/popup-list.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'app works!';

  @ViewChild('popupRoot', { read: ViewContainerRef })
  parent: ViewContainerRef;

  static PopupControler: PopupControler;
  constructor(viewContainerRef: ViewContainerRef, componentFactoryResolver: ComponentFactoryResolver) {
    AppComponent.PopupControler = new PopupControler(viewContainerRef, componentFactoryResolver);

  }
  public popup = () => {
    var popup = AppComponent.PopupControler.PopupComponent(PopupDemo);
  }

  ngOnInit() {
    setTimeout(() => {
      this.popup()
    })
  }

}
