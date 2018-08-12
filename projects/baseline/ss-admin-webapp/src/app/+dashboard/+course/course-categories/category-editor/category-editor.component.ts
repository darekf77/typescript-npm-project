import { Component, OnInit, Input } from '@angular/core';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';

import { Log, Level } from "ng2-logger/browser";
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
import { CourseCategoriesComponent } from '../course-categories.component';
import { Subscription } from 'rxjs/Subscription';
import CategoryController from 'ss-common-logic/browser/controllers/CategoryController';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

const log = Log.create('category editor')

@Component({
  selector: 'app-category-editor',
  templateUrl: './category-editor.component.html',
  styleUrls: ['./category-editor.component.scss']
})
export class CategoryEditorComponent implements OnInit {

  model: CATEGORY = {} as any;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crud: CategoryController

  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });
  }

  id: Number;


  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    log.i('id of category from routing', id)
    this.id = id;
  }

  complete() {
    this.router.navigateByUrl(`/dashboard/course/categories`);
  }

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }


}

