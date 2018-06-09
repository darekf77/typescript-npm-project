import { Injectable } from '@angular/core';

import { Resolve, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import CategoryController from 'ss-common-logic/browser/controllers/CategoryController';

@Injectable()
export class CategoriesResolver implements Resolve<Promise<CATEGORY[]>> {
    constructor(
        private category: CategoryController
    ) { }

    resolve() {
        return this.category.allCategories().received.observable
            .map(d => d.body.json)
            .take(1)
            .toPromise()
    }
}