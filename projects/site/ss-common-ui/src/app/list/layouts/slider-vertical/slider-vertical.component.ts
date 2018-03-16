import { Component, OnInit } from '@angular/core';

import * as _ from 'lodash';

@Component({
  selector: 'app-slider-vertical',
  templateUrl: './slider-vertical.component.html',
  styleUrls: ['./slider-vertical.component.scss']
})
export class SliderVerticalComponent implements OnInit {

  numbers = [];

  constructor() { }

  childs = _.times(10, d => {
    return {
      header: `test${d}`
    }
  })

  ngOnInit() {
    this.numbers = _.times(10);
  }

}
