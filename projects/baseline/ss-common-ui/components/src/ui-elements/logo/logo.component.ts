import { Component, OnInit } from '@angular/core';
import { Log, Level } from "ng2-logger/browser";

const log = Log.create('logo module');


import * as imgPathGenders from '!file-loader!./genders.png';
import * as imgPathCoupleKissing from '!file-loader!./couple-kissing.png';
import * as imgPathEiffelTower from '!file-loader!./eiffel-tower-in-paris-france.png';


@Component({
  selector: 'app-logo',
  templateUrl: 'logo.component.html',
  styleUrls: ['./logo.component.scss']
})

export class LogoComponent implements OnInit {
  imgPathGenders = imgPathGenders;
  imgPathCoupleKissing = imgPathCoupleKissing;
  imgPathEiffelTower = imgPathEiffelTower;

  constructor() { }

  ngOnInit() { }
}
