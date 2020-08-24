import { ModelDataConfig } from 'morphi';


export abstract class EntityProject {
  id: number;
  modelDataConfig?: ModelDataConfig;

  toString = () => {
    return `${this['name']}=>${this['location']}`
  };
}
