import { Component, OnInit, Input } from '@angular/core';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';

import { Log, Level } from "ng2-logger/browser";
import { ActivatedRoute, Params } from '@angular/router';
import { CourseCategoriesComponent } from '../course-categories.component';
const log = Log.create('category editor')

@Component({
  selector: 'app-category-editor',
  templateUrl: './category-editor.component.html',
  styleUrls: ['./category-editor.component.scss']
})
export class CategoryEditorComponent implements OnInit {

  public data = {
    category: undefined as CATEGORY
  }

  constructor(
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.data = this.route.snapshot.data as any;
  }

}
