import { Component, OnInit } from '@angular/core';

import * as _ from "lodash";

@Component({
  selector: 'app-slider-vertical',
  templateUrl: './slider-vertical.component.html',
  styleUrls: ['./slider-vertical.component.scss']
})
export class SliderVerticalComponent implements OnInit {

  numbers = _.times(100)

  constructor() { }

  ngOnInit() {
  }

}
