import { times } from 'lodash';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class AppMainPageComponent implements OnInit {


  numbers = [];

  constructor() { }

  childs = times(10, d => {
    return {
      header: `test${d}`
    }
  })

  ngOnInit() {
    this.numbers = times(10);
  }

}
