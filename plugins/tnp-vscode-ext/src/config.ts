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
    title: 'FIREDEV: show temp files',
    exec: 'tnp vscode:temp:show',
    options: { findNearestProject: true }
  },
  {
    title: 'FIREDEV: hide temp files',
    exec: 'tnp vscode:temp:hide',
    options: { findNearestProject: true }
  },
  {
    title: 'FIREDEV: build dist',
    exec: 'tnp build:dist',
    options: {
      findNearestProject: true
    }
  },
  {
    title: 'FIREDEV: rebuild/reinstal vscode ext',
    exec: 'tnp vscode:ext',
    options: {
      reloadAfterSuccesFinish: true,
      cancellable: false,
    }
  },
  {
    title: 'FIREDEV: TEST EXT',
    exec: 'tnp show:loop:messages --max 6 --tnpShowProgress',
    options: {
      cancellable: false,
      title: 'Testing progress'
    }
  },
  {
    title: 'FIREDEV: show version',
    exec: 'tnp version',
    options: {
      syncProcess: true,
      title: 'Show version of firedev'
    }
  }
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
  str = str.replace(/\W/g, '');
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}
