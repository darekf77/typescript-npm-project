import * as json5 from 'json5';

import { config as configMorphi } from 'morphi';

import { config } from '../../../config';
import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Models } from 'tnp-models';
import { ModelDataConfig } from 'morphi';


export abstract class EntityProject {
  id: number;
  modelDataConfig?: ModelDataConfig;
}

// export interface EntityProject extends Partial<Project> { }
