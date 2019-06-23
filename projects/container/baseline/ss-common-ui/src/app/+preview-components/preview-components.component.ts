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
      href: '/previewcomponents/processlogger',
      name: 'ProcessLogger'
    },
    {
      group: 'Formly Fields'
    },
    {
      href: '/previewcomponents/multimediawrapper',
      name: 'MultimediaWrapper'
    },
    {
      href: '/previewcomponents/selectwrapper',
      name: 'SelectWrapper'
    },
    {
      href: '/previewcomponents/editorwrapper',
      name: 'EditorWrapper'
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
    },
    {
      href: '/previewcomponents/modal',
      name: 'Modal'
    },
    {
      href: '/previewcomponents/notifications',
      name: 'Notifications'
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
