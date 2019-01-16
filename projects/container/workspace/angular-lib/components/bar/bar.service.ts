import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
// import {  } from 'isomorphic-lib/module/dupa/asd'

@Injectable()
export class BarService {

  get value(): Observable<string> {
    return Observable.of(true)
      .map((val) => `${val}`);
  }

}
