
import { Component, OnInit, Input } from '@angular/core';

import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-base-item-stepper-process-build',
    template: ''
})

export class BaseItemStepperProcessBuildComponent implements OnInit {

    @Input() formGroup: FormGroup = new FormGroup({});
    @Input() model: any;

    fields: FormlyFieldConfig[];

    constructor(


        public matDialog: MatDialog) { }

    ngOnInit() { }

}
