import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// other
import { Log, Level } from "ng2-logger/browser";
const log = Log.create('dialogs groups editor')
import { ModelDataConfig } from 'morphi/browser';
// local
import { DialogsController } from 'ss-common-logic/browser-for-ss-admin-webapp/controllers/DialogsController';
import { GroupsController } from 'ss-common-logic/browser-for-ss-admin-webapp/controllers/GroupsController';
import { GROUP } from 'ss-common-logic/browser-for-ss-admin-webapp/entities/GROUP';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-dialogs-groups-editor',
  templateUrl: './dialogs-groups-editor.component.html',
  styleUrls: ['./dialogs-groups-editor.component.scss']
})
export class DialogsGroupsEditorComponent implements OnInit {

  fields: FormlyFieldConfig[] = [
    {
      key: 'picture',
      type: 'multimediawrapper',
      templateOptions: {
        // openDialog: true,
        label: 'Input',
        placeholder: 'Placeholder',
        description: 'Description',
        required: true,
      },
    },
  ]

  modelDataConfigDialogs = new ModelDataConfig({
    joins: ['audio_pl', 'audio_fr', 'audio_en']
  });

  modelDataConfigGroup = new ModelDataConfig({
    joins: ['picture']
  });
  group: GROUP;

  constructor(
    private route: ActivatedRoute,
    private router: Router,

    public groupCRUD: GroupsController,
    public dialogsController: DialogsController
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });


  }

  mode = 'edit';

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

  async ngOnInit() {
    const categotryId = Number(this.route.snapshot.paramMap.get('id'))
    const groupid = Number(this.route.snapshot.paramMap.get('groupid'))
    log.i(`categotryId: ${categotryId}, groupid: ${groupid}`)
    // this.modelDataConfigGroup.set.where(`group.id = ${groupid}`);
    const data = await this.groupCRUD.getBy(groupid, this.modelDataConfigGroup as any).received;
    this.group = data.body.json;
    this.group.dialogs = await this.getDialgs(groupid);
    log.i('this.model', this.group)
  }


  async getDialgs(groupid) {

    this.modelDataConfigDialogs.set.where(`group.id = ${groupid}`)
    const data = await this.dialogsController.getAll(this.modelDataConfigDialogs  as any).received;
    return data.body.json;
  }

  toogleMode() {
    if (this.mode === 'view') {
      this.mode = 'edit';
      return;
    }
    this.mode = 'view';
  }


}
