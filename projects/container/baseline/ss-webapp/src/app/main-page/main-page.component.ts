import { times } from 'lodash';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: 'main-page.component.html',
  styleUrls: ['main-page.component.scss']
})
export class AppMainPageComponent implements OnInit {


  numbers = [];

  constructor() { }

  childs =[
    {
      id: 'horizontal-slider',
      title: 'Home'
    },
    {
      id: 'description',
      title: 'Description'
    },
    {
      id: 'presentation',
      title: 'Presentation'
    },
    {
      id: 'footer',
      title: 'Footer'
    },
    {
      id: 'footer2',
      title: 'Footer2'
    }
  ]

  ngOnInit() {
    this.numbers = times(10);
  }

}
