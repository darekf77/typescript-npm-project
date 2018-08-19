import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// material

import { MatCardModule } from "@angular/material/card";
// formly
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import { Log, Level } from "ng2-logger/browser";
const log = Log.create('category editor')
import { Subscription } from 'rxjs/Subscription';
import { ArrayDataConfig } from 'morphi/browser';
// local
import { CourseCategoriesComponent } from '../course-categories.component';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { CategoryController } from 'ss-common-logic/browser/controllers/CategoryController';
import { GroupsController } from 'ss-common-logic/browser/controllers/GroupsController';

@Component({
  selector: 'app-category-editor-router',
  template: `<router-outlet></router-outlet>`
})
export class CategoryEditorComponentRouter  {

}

