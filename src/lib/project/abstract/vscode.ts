import { config } from 'tnp-config/src';
import type { Project } from './project';
import { BaseVscodeHelpers, Helpers } from 'tnp-helpers/src';
import { chalk, path } from 'tnp-core/src';

export class Vscode extends BaseVscodeHelpers<Project> {
  //#region recraete jsonc schema for docs
  recreateJsonSchemaForDocs(): void {
    //#region @backendFunc
    const properSchema = {
      fileMatch: [`/${this.project.docs.docsConfig}`],
      url: `./${this.project.docs.docsConfigSchema}`,
    };

    const currentSchemas: {
      fileMatch: string[];
      url: string;
    }[] =
      this.project.getValueFromJSONC(this.settingsJson, `['json.schemas']`) ||
      [];
    const existedIndex = currentSchemas.findIndex(
      x => x.url === properSchema.url,
    );
    if (existedIndex !== -1) {
      currentSchemas[existedIndex] = properSchema;
    } else {
      currentSchemas.push(properSchema);
    }

    this.project.setValueToJSONC(
      this.settingsJson,
      '["json.schemas"]',
      currentSchemas,
    );
    //#endregion
  }
  //#endregion
}
