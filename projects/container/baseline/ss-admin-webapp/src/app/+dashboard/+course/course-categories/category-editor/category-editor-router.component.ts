import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
// material

import { MatCardModule } from '@angular/material/card';
// formly
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import { Log, Level } from 'ng2-logger';
const log = Log.create('category editor')
import { Subscription } from 'rxjs/Subscription';

// local
import { CourseCategoriesComponent } from '../course-categories.component';
import { CATEGORY } from 'ss-common-logic/src/apps/category/CATEGORY';
import { CategoryController } from 'ss-common-logic/src/apps/category/CategoryController';
import { GroupsController } from 'ss-common-logic/src/apps/group/GroupsController';

@Component({
  selector: 'app-category-editor-router',
  template: `<router-outlet></router-outlet>`
})
export class CategoryEditorComponentRouter  {

}

