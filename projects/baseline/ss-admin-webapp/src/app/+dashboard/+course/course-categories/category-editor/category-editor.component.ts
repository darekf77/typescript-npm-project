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

  form = new FormGroup({});
  model: CATEGORY = {} as any;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      key: 'name',
      type: 'input',
      templateOptions: {
        label: 'Name',
        required: true,
      }
    },
    {
      key: 'isPremium',
      type: 'checkbox',
      defaultValue: false,
      templateOptions: {
        label: 'Premium?'
      }
    }
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryController

  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    log.i('id', id)
    this.handlers.push(this.categoryService.categoryBy(id)
      .received
      .observable
      .subscribe(d => {
        this.model = d.body.json
        log.i('categories model', this.model)
      }))
  }

  ngOnDestroy() {
    this.handlers.forEach((f) => f.unsubscribe())
  }
  handlers: Subscription[] = [];

  async submit(category: CATEGORY) {
    log.i('category', category)
    await this.categoryService.updateById(category.id, category);
  }

}

