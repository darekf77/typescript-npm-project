import { Component, OnInit } from '@angular/core';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import {CategoryController} from 'ss-common-logic/browser/controllers/CategoryController';
import {ExamplesController} from 'ss-common-logic/browser/controllers/ExamplesController';
import { Subscription } from 'rxjs/Subscription';
import { Log } from 'ng2-logger';

const log = Log.create('coures categories list')

@Component({
  selector: 'app-course-categories-list',
  templateUrl: './course-categories-list.component.html',
  styleUrls: ['./course-categories-list.component.scss']
})
export class CourseCategoriesListComponent implements OnInit {

  constructor(
    public category: CategoryController,
    public example: ExamplesController
  ) { }

  ngOnInit() {

  }

}
