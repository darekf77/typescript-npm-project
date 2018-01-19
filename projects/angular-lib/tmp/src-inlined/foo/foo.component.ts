import { Component } from '@angular/core';

@Component({
  selector: 'my-foo',
  template: `
    <h1>amazing super</h1>
    <h1>This is perfect</h1>
    <mat-card>Simple card</mat-card>
    <mat-slide-toggle>Slide me!</mat-slide-toggle>
  `,
  styles: [`
    h1{color:#f0f}
  `]
})
export class FooComponent {
}


 
