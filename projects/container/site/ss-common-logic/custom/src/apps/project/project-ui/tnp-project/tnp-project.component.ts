import * as _ from 'lodash';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';



import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { ProjectController } from '../../ProjectController';
import { PROJECT } from '../../PROJECT';
import { BaseComponent } from 'baseline/ss-common-ui/components/helpers/base-component';

@Component({
  selector: 'app-tnp-project',
  templateUrl: './tnp-project.component.html',
  styleUrls: ['./tnp-project.component.scss']
})
export class TnpProjectComponent extends BaseComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) {
    super()
  }

  expandedChild: string;

  showChildren = false;
  @Output() opened = new EventEmitter();
  @Output() closed = new EventEmitter();
  @Input() expanded = false;

  @Input() isChild = false;

  @Input() model: PROJECT;

  environmentFormGroup: FormGroup;
  buildFormGroup: FormGroup;
  testFormGroup: FormGroup;
  serveFormGroup: FormGroup;

  closeChild(name: string) {
    if (this.expandedChild === name) {
      this.expandedChild = '';
    }
  }

  toogleChildren() {
    this.showChildren = !this.showChildren;
  }

  get keyForProject() {
    return `show-children-${this.model.location}`
  }

  ngClass(index: number) {
    if (this.model.isWorkspace) {
      return {
        'bold': (this.model.selectedIndex === index)
      };
    }
    return {
      'bold': (this.model.selectedIndex === index - 1)
    };
  }

  async selectionChange(e: StepperSelectionEvent) {
    this.model.selectedIndex = e.selectedIndex;
    if (this.model.selectedIndex === 0) {
      await this.model.updateEndGetEnvironments()
    }
  }

  async ngOnInit() {
    // if (this.model && this.model.isWorkspace) {
    this.environmentFormGroup = this.formBuilder.group({});
    // }
    this.buildFormGroup = this.formBuilder.group({});
    this.testFormGroup = this.formBuilder.group({});
    this.serveFormGroup = this.formBuilder.group({});

    if (!this.model.isWorkspace) {
      this.showChildren = true;
    }


    if (this.model.isWorkspace) {
      this.expanded = !!window.localStorage.getItem(this.keyForProject)
      if (this.expanded) {
        await this.updateModel();
      }
    }



    this.handlers.push(this.opened.subscribe(async () => {
      window.localStorage.setItem(this.keyForProject, 'true');
      if (this.expanded) {
        await this.updateModel();
      }
    }));
    this.handlers.push(this.closed.subscribe(() => {
      window.localStorage.removeItem(this.keyForProject);
    }));
  }

  async updateModel() {
    await this.model.updaetAndGetProceses()
    await this.model.updateEndGetEnvironments();
    // return _.debounce(async () => {

    // }, 1000)
  }

}
