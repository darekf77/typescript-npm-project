import { Component, OnInit } from '@angular/core';
import { CategoriesComponent } from '../categories.component';

@Component({
  selector: 'app-street',
  templateUrl: '../categories.component.html',
  styleUrls: ['../categories.component.scss']
})
export class StreetComponent extends CategoriesComponent implements OnInit {

  constructor() {
    super("/assets/img/categories/street.jpg")
  }

  ngOnInit() {
  }

}
