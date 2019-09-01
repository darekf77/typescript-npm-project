import * as json5 from 'json5';

import { config as configMorphi } from 'morphi/build/config';

import { config } from '../../../config';
import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Models } from '../../../models';
import { ModelDataConfig } from 'morphi';


export abstract class EntityProject {
  id: number;
  modelDataConfig?: ModelDataConfig;
}

// export interface EntityProject extends Partial<Project> { }
