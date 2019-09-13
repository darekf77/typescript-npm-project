
//#region @backend
import * as _ from 'lodash';
import { Models } from '../../models';

import { ProjectFactory } from './project-factory.backend';

export function NEW(args: string, exit = true) {
  const cwd = process.cwd();
  const argv = args.split(' ');
  const type = argv[0] as Models.libs.NewFactoryType;
  if (type === 'model') {
    ProjectFactory.Instance.createModelFromArgs(args, exit, cwd);
  } else {
    ProjectFactory.Instance.workspaceFromArgs(args, exit, cwd)
  }
}
export function NEW_SITE(args: string, exit = true) {
  const cwd = process.cwd();
  ProjectFactory.Instance.workspaceSiteFromArgs(args, exit, cwd);
}

export default {
  NEW,
  NEW_SITE
};

//#endregion
