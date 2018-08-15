import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// material

import { MatCardModule } from "@angular/material/card";
// formly
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import { Log, Level } from "ng2-logger/browser";
const log = Log.create('category editor')
import { Subscription } from 'rxjs/Subscription';
import { ArrayDataConfig } from 'morphi/browser';
// local
import { CourseCategoriesComponent } from '../course-categories.component';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { CategoryController } from 'ss-common-logic/browser/controllers/CategoryController';
import { GroupsController } from 'ss-common-logic/browser/controllers/GroupsController';

@Component({
  selector: 'app-category-editor',
  templateUrl: './category-editor.component.html',
  styleUrls: ['./category-editor.component.scss']
})
export class CategoryEditorComponent implements OnInit {

  model: CATEGORY = {} as any;

  arrayDataConfig = new ArrayDataConfig({
    joins: ['category']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crud: CategoryController,
    private GroupsController: GroupsController

  ) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });

    const id = Number(this.route.snapshot.paramMap.get('id'))
    log.i('id of category from routing', id)
    this.id = id;
    this.arrayDataConfig.where.push(`category.id = ${id}`)
  }

  id: Number;


  async ngOnInit() {

  }

  complete() {
    this.router.navigateByUrl(`/dashboard/course/categories`);
  }

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }


}

