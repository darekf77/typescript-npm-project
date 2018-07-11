import { Component, OnInit } from '@angular/core';

export const menuLeft // : ComponentsMenuItem[]
  = [
    {
      href: '/previewcomponents/formlyinputs',
      name: '-- fromly inputs ---'
    },
    {
      href: '/previewcomponents/selectwrapper',
      name: 'SelectWrapper'
    },
    {
      href: '/previewcomponents/listwrapper',
      name: 'ListWrapper'
    },
    {
      href: '/previewcomponents/tablewrapper',
      name: 'TableWrapper'
    },
    {
      href: '/previewcomponents/commonlogin',
      name: 'Common Login'
    },
    {
      name: 'Select'
    },
    {
      href: '/previewcomponents/logo',
      name: 'Logo'
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
