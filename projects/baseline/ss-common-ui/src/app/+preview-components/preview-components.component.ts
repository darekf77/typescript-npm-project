import { Component, OnInit } from '@angular/core';

export const menuLeft // : ComponentsMenuItem[]
  = [
    {
      href: '/previewcomponents/formlyinputs',
      name: '-- fromly inputs ---'
    },
    {
      group: 'High abstraction componetns'
    },
    {
      href: '/previewcomponents/formwrapper',
      name: 'FormWrapper'
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
      group: 'Formly Fields'
    },
    {
      name: 'PicturesField'
    },
    {
      name: 'AudioField'
    },
    {
      href: '/previewcomponents/selectwrapper',
      name: 'SelectWrapper'
    },
    {
      group: 'Custom Formly Fields'
    },
    {
      name: 'DialogField'
    },
    {
      name: 'DialogRepeatSecion'
    },
    {
      group: 'Authentication'
    },
    {
      href: '/previewcomponents/commonlogin',
      name: 'Common Login'
    },
    {
      group: 'Commoun ui parts'
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
