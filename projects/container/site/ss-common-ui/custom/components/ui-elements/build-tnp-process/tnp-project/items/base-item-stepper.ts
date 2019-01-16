
import { Component, OnInit, Input } from '@angular/core';
import { TNP_PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/entities/TNP_PROJECT';
import { TnpProjectController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/TnpProjectController';
import { BuildController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/BuildController';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-base-item-stepper-process-build',
    template: ''
})

export class BaseItemStepperProcessBuildComponent implements OnInit {

    @Input() formGroup: FormGroup = new FormGroup({});
    @Input() model: TNP_PROJECT;

    fields: FormlyFieldConfig[];

    constructor(
        public projectController: TnpProjectController,
        public buildController: BuildController,

        public matDialog: MatDialog) { }

    ngOnInit() { }

}
