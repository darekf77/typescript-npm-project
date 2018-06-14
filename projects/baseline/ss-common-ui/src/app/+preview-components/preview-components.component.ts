import { Component, OnInit } from '@angular/core';

export const menuLeft // : ComponentsMenuItem[]
 = [
  {
    href: '/previewcomponents/tablewrapper',
    name: 'MatTableWrapper'
  }
];

@Component({
  selector: 'app-preview-components',
  templateUrl: './preview-components.component.html',
  styleUrls: ['./preview-components.component.scss']
})
export class PreviewComponents implements OnInit {

  menuLeft = menuLeft;

  constructor() { }


  ngOnInit() {

  }

}
