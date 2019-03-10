import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-recrusive-menu',
  templateUrl: './recrusive-menu.component.html',
  styleUrls: ['./recrusive-menu.component.scss']
})
export class RecrusiveMenuComponent implements OnInit {

  @Input() items: any[] = [];
  @Input() selectedItem: any;
  @Input() childrenProperty = 'children';
  @Input() nameProperty = 'name';

  @Output() selected = new EventEmitter();
  onSelected(item: any) {
    this.selectedItem = item;
    this.selected.next(item);
  }

  constructor() { }

  ngOnInit() {
  }

}
