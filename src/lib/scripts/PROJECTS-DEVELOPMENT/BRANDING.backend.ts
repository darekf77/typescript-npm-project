import chalk from 'chalk';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import { glob } from 'tnp-core';
// import * as favicons from 'favicons';
import { _ } from 'tnp-core';
// import * as sharp from 'sharp';
// import { png2svg } from 'svg-png-converter';

import { Helpers } from 'tnp-helpers';
import { Project } from '../../project';
import { config } from 'tnp-config';



export async function $BRANDING(args: string, exit = true) {

  const proj = (Project.Current as Project);




  Helpers.info('DONE');

  if (exit) {
    process.exit(0);
  }

}

export function faviconsDesc() {
  return {
    "masterPicture": config.pathes.logoPng,
    "iconsPath": "/",
    "design": {
      "ios": {
        "pictureAspect": "noChange",
        "assets": {
          "ios6AndPriorIcons": false,
          "ios7AndLaterIcons": false,
          "precomposedIcons": false,
          "declareOnlyDefaultIcon": true
        }
      },
      "desktopBrowser": {},
      "windows": {
        "pictureAspect": "noChange",
        "backgroundColor": "#da532c",
        "onConflict": "override",
        "assets": {
          "windows80Ie10Tile": false,
          "windows10Ie11EdgeTiles": {
            "small": false,
            "medium": true,
            "big": false,
            "rectangle": false
          }
        }
      },
      "androidChrome": {
        "pictureAspect": "backgroundAndMargin",
        "margin": "17%",
        "backgroundColor": "#ffffff",
        "themeColor": "#ffffff",
        "manifest": {
          "display": "standalone",
          "orientation": "notSet",
          "onConflict": "override",
          "declared": true
        },
        "assets": {
          "legacyIcon": false,
          "lowResolutionIcons": false
        }
      },
      "safariPinnedTab": {
        "pictureAspect": "silhouette",
        "themeColor": "#5bbad5"
      }
    },
    "settings": {
      "scalingAlgorithm": "Mitchell",
      "errorOnImageTooSmall": false,
      "readmeFile": false,
      "htmlCodeFile": false,
      "usePathAsIs": false
    }
  }

}


export default {
  $BRANDING: Helpers.CLIWRAP($BRANDING, '$BRANDING'),
}
