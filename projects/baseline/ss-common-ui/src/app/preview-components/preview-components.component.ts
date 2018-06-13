import { Component, OnInit } from '@angular/core';

import { menuLeft } from './preview-components.routes';

@Component({
  selector: 'preview-components',
  template: `
asdasd
    <router-outlet></router-outlet>
  ` ,
  styleUrls: ['./preview-components.component.scss']
})
export class PreviewComponents implements OnInit {

  menuLeft = menuLeft;

  constructor() { }


  ngOnInit() {

  }

}
