import { Component, OnInit } from '@angular/core';

import * as _ from 'lodash';

@Component({
  selector: 'preview-slider-vertical',
  templateUrl: './preview-slider-vertical.component.html',
  styleUrls: ['./preview-slider-vertical.component.scss']
})
export class PreviewSliderVerticalComponent implements OnInit {

  numbers = [];

  constructor() { }

  childs = _.times(10, d => {
    return {
      header: `test${d}`
    };
  });

  ngOnInit() {
    this.numbers = _.times(10);
  }

}


// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { MatTabsModule } from '@angular/material/tabs';
// import { MatSidenavModule } from '@angular/material/sidenav';
// // local
// import { SliderVerticalComponent } from './preview-slider-vertical.component';
// import { SliderVerticalModule } from '../../layouts/slider-vertical';

// const modules = [
//   MatTabsModule,
//   MatSidenavModule
// ];

// @NgModule({
//   imports: [
//     CommonModule,
//     SliderVerticalModule,
//     ...modules
//   ],
//   declarations: [SliderVerticalComponent]
// })
// export class PreviewSliderVerticalModule { }
