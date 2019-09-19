import { Component, OnInit } from '@angular/core';
import { Morphi } from 'morphi'

@Component({
  selector: 'app-my-module-morphi',
  templateUrl: './my-module-morphi.component.html',
  styleUrls: ['./my-module-morphi.component.scss']
})
export class MyModuleMorphiComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  asdas() {
    console.log('ab')
  }

}
