import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dialogs-groups',
  template: `<router-outlet></router-outlet>`
})
export class DialogsGroupsComponent implements OnInit {

  constructor(private route: ActivatedRoute) {
    console.log(this.route.snapshot.data['group']);
  }

  ngOnInit() {
  }

}
