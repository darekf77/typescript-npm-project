//#region angular
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
//#endregion

//#region isomorphic
import { _ } from 'tnp-core';
import { TnpProjectTabIndex } from './tabs-menu-tnp-project';
import { PROJECT } from '../../PROJECT';
import { BaseComponent } from 'tnp-helpers';
//#endregion

@Component({
  selector: 'app-tnp-project',
  templateUrl: './tnp-project.component.html',
  styleUrls: ['./tnp-project.component.scss']
})
export class TnpProjectComponent extends BaseComponent implements OnInit {
  TnpProjectTabIndex = TnpProjectTabIndex;

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
  releaseFormGroup: FormGroup;

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
    if (this.model.selectedIndex === TnpProjectTabIndex.ENV) {
      await this.model.updateEndGetEnvironments()
    }
  }

  async ngOnInit() {
    // if (this.model && this.model.isWorkspace) {
    this.environmentFormGroup = this.formBuilder.group({
      hidden: ['', Validators.required]
    });
    // }
    this.buildFormGroup = this.formBuilder.group({
      // hidden: ['', Validators.required]
    });
    this.testFormGroup = this.formBuilder.group({
      // hidden: ['', Validators.required]
    });
    this.serveFormGroup = this.formBuilder.group({
      // hidden: ['', Validators.required]
    });

    this.releaseFormGroup = this.formBuilder.group({
      // hidden: ['', Validators.required]
    });

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
    }) as any);
    this.handlers.push(this.closed.subscribe(() => {
      window.localStorage.removeItem(this.keyForProject);
    }) as any);
  }

  async updateModel() {
    await this.model.updaetAndGetProceses()
    await this.model.updateEndGetEnvironments();
    if (this.model.selectedEnv && this.model.selectedEnv.length > 2) {
      this.model.selectedIndex = TnpProjectTabIndex.ENV;
    }
  }

}
