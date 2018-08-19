import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// other
import { Log, Level } from "ng2-logger/browser";
const log = Log.create('dialogs groups editor')
import { ArrayDataConfig } from 'morphi/browser';
// local
import DialogsController from 'ss-common-logic/browser/controllers/DialogsController';
import GroupsController from 'ss-common-logic/browser/controllers/GroupsController';
import { GROUP } from 'ss-common-logic/browser/entities/GROUP';

@Component({
  selector: 'app-dialogs-groups-editor',
  templateUrl: './dialogs-groups-editor.component.html',
  styleUrls: ['./dialogs-groups-editor.component.scss']
})
export class DialogsGroupsEditorComponent implements OnInit {

  arrayDataConfig = new ArrayDataConfig({
    joins: ['group']
  });
  model: GROUP;

  constructor(
    private route: ActivatedRoute,
    private router: Router,

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

    this.model = this.route.snapshot.data['group']
    this.arrayDataConfig.where.push(`group.id = ${groupid}`);
  }

  async complete() {
    let routerLink = this.route.parent.snapshot.pathFromRoot
      .map(s => s.url)
      .reduce((a, e) => a.concat(e))
    routerLink = routerLink.slice(0, routerLink.length - 2)
    let link = routerLink.map(s => s.path);

    this.router.navigate(link);
    // await this.router.navigate(['../../'], { relativeTo: this.route })
    log.i('should be and navigation', link)
  }

  ngOnInit() {
  }

}
