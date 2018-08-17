import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// other
import { Log, Level } from "ng2-logger/browser";
const log = Log.create('dialogs groups editor')

@Component({
  selector: 'app-dialogs-groups-editor',
  templateUrl: './dialogs-groups-editor.component.html',
  styleUrls: ['./dialogs-groups-editor.component.scss']
})
export class DialogsGroupsEditorComponent implements OnInit {

  constructor(private route: ActivatedRoute,
    private router: Router) {

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
