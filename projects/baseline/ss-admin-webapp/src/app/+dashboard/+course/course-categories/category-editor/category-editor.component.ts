import { Component, OnInit, Input } from '@angular/core';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';

@Component({
  selector: 'app-category-editor',
  templateUrl: './category-editor.component.html',
  styleUrls: ['./category-editor.component.scss']
})
export class CategoryEditorComponent implements OnInit {

  @Input() public category: CATEGORY;

  constructor() { }

  ngOnInit() {
  }

}
