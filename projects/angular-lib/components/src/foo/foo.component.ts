import { Component } from '@angular/core';

@Component({
  selector: 'my-foo',
  template: `
  <h1>amazog it is very useful </h1>`,
  styles: [`

h1 {
  color: $colourful;
}

  `]
})
export class FooComponent {
}
