import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import {CategoryController} from 'ss-common-logic/src/apps/category/CategoryController';
import { CATEGORY } from 'ss-common-logic/src/apps/category/CATEGORY';
import { Log, Level } from 'ng2-logger';
import { isNumber } from 'lodash';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Observable } from 'rxjs/Observable';

const log = Log.create('Courese categories')

@Component({
  selector: 'app-course-categories',
  templateUrl: './course-categories.component.html',
  styleUrls: ['./course-categories.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseCategoriesComponent implements OnInit {


  constructor(
    private category: CategoryController,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {

  }

  ngOnInit() {

  }


}
