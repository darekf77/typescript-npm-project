import {
  Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ViewEncapsulation
} from '@angular/core';
import { Observable } from 'rxjs/Observable';

console.log('Stuning')
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {


}
