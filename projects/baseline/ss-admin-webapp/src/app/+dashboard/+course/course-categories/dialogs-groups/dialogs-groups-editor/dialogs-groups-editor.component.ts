import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// other
import { Log, Level } from "ng2-logger/browser";
const log = Log.create('dialogs groups editor')
// local
import DialogsController from 'ss-common-logic/browser/controllers/DialogsController';
import GroupsController from 'ss-common-logic/browser/controllers/GroupsController';

@Component({
  selector: 'app-dialogs-groups-editor',
  templateUrl: './dialogs-groups-editor.component.html',
  styleUrls: ['./dialogs-groups-editor.component.scss']
})
export class DialogsGroupsEditorComponent implements OnInit {

  model = {}

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialogsCRUD: DialogsController,
    public groupCRUD: GroupsController
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });

    const categotryId = Number(this.route.snapshot.paramMap.get('id'))
    const groupid = Number(this.route.snapshot.paramMap.get('groupid'))
    log.i(`categotryId: ${categotryId}, groupid: ${groupid}`)

  }

  ngOnInit() {
  }

}
