import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BarService } from 'components';


@Component({
  selector: 'app-root',
  template: `
<my-foo></my-foo>
<hr>
<marquee>{{ value$ | async }}</marquee>
`,
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  value$: Observable<string>;

  constructor(
    bar: BarService
  ) {
    this.value$ = bar.value;
  }

}
