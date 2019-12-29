import { CLASS } from 'typescript-class-helpers';

export function CLIWRAP(f: Function, name: string) {
  CLASS.setName(f, name);
  return f;
}
