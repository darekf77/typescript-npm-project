
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'selector-name',
  templateUrl: 'categories.component.html',
  styleUrls: ['categories.component.scss']
})

export abstract class CategoriesComponent implements OnInit {
  constructor(public urlPicture: string) {

  }

  ngOnInit() { }
}
