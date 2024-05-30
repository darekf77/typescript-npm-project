//#region @backend
import { CoreModels, _, crossPlatformPath, path } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';

/**
 # Branding of assets
- from logo.svg or logo.png
  + create icon
  + create favicons
  + create splashscreens
  + create logos inside apps


# Branding of existed modules/projects
  - rename to create similar module or project:
    + files
    + folders
    + files contents

 */
export class $Branding extends CommandLineFeature<{}, Project> {
  protected __initialize__(): void {
    this._tryResolveChildIfInsideArg();
  }

  public async _() {
    await this.project.__branding.apply(true);
    this._exit();
  }
}

export default {
  $Branding: Helpers.CLIWRAP($Branding, '$Branding'),
};
