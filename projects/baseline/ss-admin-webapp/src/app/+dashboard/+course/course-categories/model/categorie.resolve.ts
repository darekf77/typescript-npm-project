import { Injectable } from '@angular/core';

import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import CategoryController from 'ss-common-logic/browser/controllers/CategoryController';
import { Log } from 'ng2-logger/browser';

const log = Log.create('Categories resolve')

@Injectable()
export class CategoryResolver implements Resolve<Promise<CATEGORY>> {
    constructor(private category: CategoryController) { }

    async resolve(route: ActivatedRouteSnapshot) {
        const id = route.params['id'];
        log.i('id', id)
        return this.category.categoryBy(id).received.observable
            .map(d => d.body.json)
            .take(1)
            .toPromise()
    }
}