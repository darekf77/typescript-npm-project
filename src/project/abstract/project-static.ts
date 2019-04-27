import { Project } from './project';
import { LibType } from '../../models';

export function ProjectFrom(location: string) {
  return Project.From(location);
}

export function ProjectDefaultPortByType(type: LibType) {
  return Project.DefaultPortByType(type)
}
