import { config } from 'tnp-config/src';
import type { Project } from './project';
import { BaseVscodeHelpers, Helpers } from 'tnp-helpers/src';
import { chalk, path } from 'tnp-core/src';
import { taonConfigSchemaJson } from '../../constants';

/**
 * TODO refactor this class
 */
export class Vscode extends BaseVscodeHelpers<Project> {
  //#region recraete jsonc schema for docs
  recreateJsonSchemas(): void {
    this.recreateJsonSchemaForDocs();
    this.recreateJsonSchemaForTaon();
  }
  //#endregion


  //#region recraete jsonc schema for docs
  private recreateJsonSchemaForDocs(): void {
    //#region @backendFunc
    const properSchema = {
      fileMatch: [`/${this.project.docs.docsConfigJsonFileName}`],
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


  //#region recraete jsonc schema for docs
  private recreateJsonSchemaForTaon(): void {
    //#region @backendFunc
    const properSchema = {
      fileMatch: [`/${config.file.taon_jsonc}`],
      url: `./${taonConfigSchemaJson}`,
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
