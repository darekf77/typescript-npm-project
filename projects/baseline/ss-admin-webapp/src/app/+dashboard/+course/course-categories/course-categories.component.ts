import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs/Subscription";
import CategoryController from 'ss-common-logic/browser/controllers/CategoryController';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { Log, Level } from "ng2-logger/browser";
import { isNumber } from "lodash";
import { Router } from "@angular/router";
import { Location } from "@angular/common";

const log = Log.create('Courese categories')

@Component({
  selector: 'app-course-categories',
  templateUrl: './course-categories.component.html',
  styleUrls: ['./course-categories.component.scss']
})
export class CourseCategoriesComponent implements OnInit {

  messages = [
    {
      from: 'asdasd',
      subject: 'Sibubasubduasbd',
      content: 'contentntete'
    },
    {
      from: '2222fromasdasd',
      subject: '222Sibubasubduasbd',
      content: '222contentntete'
    }
  ]
  handlers: Subscription[] = [];
  constructor(
    private category: CategoryController,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {

  }

  categories: CATEGORY[] = [];
  selected: number;

  // open(category: CATEGORY) {
  //   this.router.navigateByUrl(`/dashboard/course/categories?id=${category.id}`, {
  //     replaceUrl: false
  //   })
  //   this.goToCategoryBy(category.id)
  // }

  // private async goToCategoryBy(id: number) {
  //   log.i('id of category', id)
  //   this.selected = (await this.category.categoryBy(id).received).body.json
  //   log.i('selected', this.selected)
  // }

  // private async reload() {
  //   this.selected = undefined;
  //   const id = Number(this.route.snapshot.queryParams['id'])
  //   if (!isNaN(id)) {
  //     this.goToCategoryBy(id)
  //   } else {
  //     this.selected = undefined;
  //     this.handlers.push(this.category.allCategories().received.observable.subscribe(categories => {
  //       this.categories = categories.body.json
  //     }))
  //   }
  // }

  async ngOnInit() {
    log.i('this.route.snapshot.queryParams', this.route.snapshot.queryParams)
    // this.reload()
    // this.router.routerState.snapshot.url
  }

  ngOnDestroy() {
    this.selected = undefined;
    this.handlers.forEach(f => f.unsubscribe())
  }

}
