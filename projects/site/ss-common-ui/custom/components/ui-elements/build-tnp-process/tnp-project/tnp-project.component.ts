import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { EnvironmentName } from 'tnp-bundle/browser';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

@Component({
  selector: 'app-tnp-project',
  templateUrl: './tnp-project.component.html',
  styleUrls: ['./tnp-project.component.scss']
})
export class TnpProjectComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  expandedChild: string;
  selectedIndex = 0;
  showChildren = false;
  @Output() opened = new EventEmitter();
  @Output() closed = new EventEmitter();
  @Input() expanded = false;

  @Input() isChild = false;

  @Input() model: TNP_PROJECT;

  environmentFormGroup: FormGroup;
  buildFormGroup: FormGroup;
  testFormGroup: FormGroup;
  serveFormGroup: FormGroup;

  closeChild(name: string) {
    if (this.expandedChild === name) {
      this.expandedChild = '';
    }
  }

  selectionChange(e: StepperSelectionEvent) {
    this.selectedIndex = e.selectedIndex;
  }

  ngOnInit() {
    if (this.model && this.model.isWorkspace) {
      this.environmentFormGroup = this.formBuilder.group({});
    }
    this.buildFormGroup = this.formBuilder.group({});
    this.testFormGroup = this.formBuilder.group({});
    this.serveFormGroup = this.formBuilder.group({});
  }

}
