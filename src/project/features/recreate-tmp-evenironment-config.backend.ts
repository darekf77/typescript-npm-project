import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Project } from '../abstract/project';

export function recreateTmpWorkspace(baseline: Project, destinationPath: string, generateSamplePorject = false) {

  const projectsConfig = [];
  baseline.children.forEach(c => {
    if (generateSamplePorject) {
      const generatedChildLation = path.join(destinationPath, c.name)
      c.copyManager.generateSourceCopyIn(generatedChildLation, {
        markAsGenerated: false,
      });
    }
    if (c.typeIs('angular-lib')) {
      projectsConfig.push({
        baseUrl: `/${c.name}`,
        name: c.name,
        port: config.startPort + projectsConfig.length,
      });
    }
    if (c.typeIs('isomorphic-lib')) {
      projectsConfig.push({
        baseUrl: `/api-${c.name}`,
        name: c.name,
        $db: {
          database: `tmp/db-for-${c.name}.sqlite3`,
          type: 'sqlite',
          synchronize: true,
          dropSchema: true,
          logging: false
        },
        port: config.startPort + projectsConfig.length,
      });
    }
  });

  // replace environment.js placholder
  const environmentJsFilePath = path.join(destinationPath, 'environment.js');
  let file = Helpers.readFile(environmentJsFilePath);
  const palaceHolderContent = JSON.stringify(projectsConfig, null, 2).replace(/^\[/g, '').replace(/\]$/g, '');
  file = file.replace('//<PLACEHOLDER_FOR_PROJECTS>', palaceHolderContent);
  Helpers.writeFile(environmentJsFilePath, file);
  Helpers.remove(path.join(destinationPath, config.file.tnpEnvironment_json));
}

