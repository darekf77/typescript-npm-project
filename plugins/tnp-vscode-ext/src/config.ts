import { ProcesOptions } from './process-options';

const group = 'Firedev CLI essentials';

export type CommandType = {
  command?: string;
  exec?: string;
  title?: string;
  group?: string;
  options?: ProcesOptions;
}

export const commands: CommandType[] = ([
  {
    title: 'FIREDEV TEMP FILES - show',
    exec: 'tnp vscode:temp:show',
    options: {
      title: 'show temporary files',
      findNearestProject: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV TEMP FILES - hide',
    exec: 'tnp vscode:temp:hide',
    options: {
      title: 'hide temporary files',
      findNearestProject: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV BUILD dist',
    exec: 'tnp build:dist',
    options: {
      title: 'distribution build',
      findNearestProject: true
    }
  },
  // {
  //   title: 'FIREDEV STATIC REBUILD AND START',
  //   exec: 'tnp static:build:dist && tnp start',
  //   options: {
  //     findNearestProjectType: 'workspace',
  //   }
  // },
  // {
  //   title: 'FIREDEV STATIC REBUILD PROD AND START',
  //   exec: 'tnp static:build:dist:prod && tnp start',
  //   options: {
  //     findNearestProjectType: 'workspace',
  //   }
  // },
  // {
  //   title: 'FIREDEV STATIC START workspace',
  //   exec: 'tnp start',
  //   options: {
  //     findNearestProjectType: 'workspace',
  //   }
  // },
  {
    title: 'FIREDEV STATIC BUILD dist',
    exec: 'tnp static:build:dist',
    options: {
      title: 'static (for workspace) distribution build',
      findNearestProject: true,
    }
  },
  {
    title: 'FIREDEV STATIC BUILD PROD dist',
    exec: 'tnp static:build:dist:prod',
    options: {
      title: 'static (for workspace) distribution production build',
      findNearestProject: true,
    }
  },
  {
    title: 'FIREDEV PACKAGE.JSON hide deps',
    exec: 'tnp deps:hide',
    options: {
      title: 'package.json hide dependencies',
      findNearestProject: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV PACKAGE.JSON show deps',
    exec: 'tnp deps:show',
    options: {
      title: 'package.json show dependencies',
      findNearestProject: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV INIT project',
    exec: 'tnp init',
    options: {
      title: 'init project temporary files',
      findNearestProject: true,
    }
  },
  {
    title: 'FIREDEV RELEASE project',
    exec: 'tnp release',
    options: {
      title: 'release project',
      findNearestProject: true
    }
  },
  {
    title: 'FIREDEV RESET project',
    exec: 'tnp reset',
    options: {
      title: 'remove project temporary files',
      findNearestProject: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV CLEAN AND INIT',
    exec: 'tnp clean && tnp init',
    options: {
      title: 'clean and init projects',
      findNearestProject: true,
      askBeforeExecute: true,
    }
  },
  // {
  //   title: 'FIREDEV RESET_ALL projects',
  //   exec: 'tnp reset:all',
  //   options: {
  //     title: 'remove workspace projects temporary files',
  //     findNearestProject: true
  //   }
  // },
  // {
  //   title: 'FIREDEV CLEAR project',
  //   exec: 'tnp clear',
  //   options: {
  //     findNearestProject: true
  //   }
  // },
  // {
  //   title: 'FIREDEV CLEAR_ALL projects',
  //   exec: 'tnp clear:all',
  //   options: {
  //     findNearestProject: true
  //   }
  // },
  // {
  //   title: 'FIREDEV STATIC CLEAR',
  //   exec: 'tnp static:clear:all',
  //   options: {
  //     findNearestProject: true
  //   }
  // },
  // {
  //   title: 'FIREDEV STATIC CLEAR_ALL',
  //   exec: 'tnp static:clear:all',
  //   options: {
  //     findNearestProject: true
  //   }
  // },
  {
    title: 'FIREDEV QUICK GIT commit and push update',
    exec: `tnp ${camelize('$GIT_QUICK_COMMIT_AND_PUSH')}`,
    options: {
      title: 'quick git commit and push',
      findNearestProjectWithGitRoot: true,
    }
  },
  {
    title: 'FIREDEV QUICK GIT reset hard and pull',
    exec: `tnp ${camelize('$GIT_QUICK_RESET_HARD_AND_PULL')}`,
    options: {
      title: 'quick git reset and pull',
      findNearestProjectWithGitRoot: true,
      askBeforeExecute: true,
    }
  },
  {
    title: 'FIREDEV AUTOUPDATE',
    exec: 'tnp vscode:ext',
    options: {
      title: 'firedev vscode extension autoupdate',
      reloadAfterSuccesFinish: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV FIX termial vscode',
    exec: 'tnp vscodefix',
    options: {
      cancellable: false,
    }
  },
  // {
  //   title: 'FIREDEV: TEST EXT',
  //   exec: 'tnp show:loop:messages --max 6 --tnpShowProgress',
  //   options: {
  //     cancellable: false,
  //     title: 'Testing progress'
  //   }
  // },
  // {
  //   title: 'FIREDEV: show version',
  //   exec: 'tnp version',
  //   options: {
  //     syncProcess: true,
  //     title: 'Show version of firedev'
  //   }
  // },

  // only for tests
  // {
  //   title: 'FIREDEV TEST nearest project',
  //   exec: 'tnp processcwd',
  //   options: {
  //     findNearestProject: true,
  //     syncProcess: true
  //   }
  // },
  // {
  //   title: 'FIREDEV TEST nearest project with git root',
  //   exec: 'tnp processcwd',
  //   options: {
  //     findNearestProjectWithGitRoot: true,
  //     syncProcess: true
  //   }
  // },
  // {
  //   title: 'FIREDEV TEST nearest project workspace',
  //   exec: 'tnp processcwd',
  //   options: {
  //     findNearestProjectType: 'container',
  //     syncProcess: true
  //   }
  // },
  // {
  //   title: 'FIREDEV TEST nearest project workspace with git root',
  //   exec: 'tnp processcwd',
  //   options: {
  //     findNearestProjectTypeWithGitRoot: 'workspace',
  //     syncProcess: true
  //   }
  // }
] as CommandType[]).map(c => {
  if (!c.command) {
    c.command = `extension.${camelize(c.title)}`;
  }
  if (!c.group) {
    c.group = group;
  }
  return c;
})


function camelize(str: string = '') {
  str = str.replace(/\W/g, '').toLowerCase();
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}
