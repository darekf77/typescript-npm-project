import { Component, OnInit } from '@angular/core';
import { Log, Level } from 'ng2-logger';

console.log('asd')
declare const ENV;

const log = Log.create('logo module');


@Component({
    selector: 'app-logo',
    templateUrl: 'logo.component.html',
    styleUrls: ['./logo.component.scss']
})

export class LogoComponent implements OnInit {

    ENV = ENV;
    constructor() { }

    ngOnInit() {
      console.log('ENV in cmp',ENV)
    }
}
