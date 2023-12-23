import { IncCompiler } from "incremental-compiler/src";
import { config } from "tnp-config/src";
import { crossPlatformPath, glob, path } from "tnp-core/src";
import { BuildOptions } from "tnp-db/src";
import { Helpers } from "tnp-helpers/src";
import { Models } from "tnp-models/src";
import { CLASS } from "typescript-class-helpers/src";
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
