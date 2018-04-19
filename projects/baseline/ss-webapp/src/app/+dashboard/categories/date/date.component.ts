import { Component, OnInit } from '@angular/core';
import { CategoriesComponent } from '../categories.component';

@Component({
  selector: 'app-date',
  templateUrl: '../categories.component.html',
  styleUrls: ['../categories.component.scss']
})
export class DateComponent extends CategoriesComponent implements OnInit {

  constructor() {
    super("/assets/img/categories/date.jpg")
  }

  ngOnInit() {
  }

}
