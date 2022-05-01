

export abstract class EntityProject {
  id: number;

  toString = () => {
    return `${this['name']}=>${this['location']}`
  };
}
