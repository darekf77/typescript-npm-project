import { IncCompiler } from "incremental-compiler";
import { config } from "tnp-config";
import { crossPlatformPath, glob, path } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { Project } from "../../abstract/project/project";
import { BaseCopyManger } from "./base-copy-manager.backend";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import type { CopyManagerOrganization } from "./copy-manager-organization.backend";
import type { CopyManagerStandalone } from "./copy-manager-standalone.backend";

@CLASS.NAME('CopyManager')
export abstract class CopyManager extends BaseCopyManger {

  //#region static
  static for(project: Project): CopyManager {
    if (project.isSmartContainer) {
      const CopyManagerOrganizationClass = CLASS.getBy('CopyManagerOrganization') as typeof CopyManagerOrganization;
      return new CopyManagerOrganizationClass(project);
    } else {
      const CopyManagerStandaloneClass = CLASS.getBy('CopyManagerStandalone') as typeof CopyManagerStandalone;
      return new CopyManagerStandaloneClass(project);
    }
  }
  //#endregion
  abstract init(
    buildOptions: BuildOptions,
    renameDestinationFolder?: string,
  ): void;
}
