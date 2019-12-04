import * as path from 'path';
import * as fse from 'fs-extra';
import * as sharp from 'sharp';
import { png2svg } from 'svg-png-converter';

import { Helpers } from '../helpers';
import { Project } from '../project';
import { config } from '../config';


export async function $BRANDING(args: string, exit = true) {

  const proj = Project.Current;
  const pathes = {
    favicondesc: 'tmp-fav-icon-description.json'
  };

  Helpers.log('Generation svg...');

  let { content } = await png2svg({
    tracer: 'imagetracer',
    optimize: true,
    input: fse.readFileSync(path.join(proj.location, config.pathes.logoPng)),
    numberofcolors: 24,
    pathomit: 1,
  })
  fse.writeFileSync(config.pathes.logoSvg, content)

  Helpers.log('Generation favicons...');
  Helpers.writeFile(path.join(proj.location, pathes.favicondesc), faviconsDesc());
  Helpers.mkdirp(path.join(proj.location, 'src/assets/favicons'));
  proj.run(`real-favicon generate ${pathes.favicondesc} tmp-faviconout.json src/assets/favicons`).sync();
  Helpers.copyFile(path.join(proj.location, 'src/assets/favicons/favicon.ico'), path.join(proj.location, 'src/favicon.ico'));

  Helpers.log('Generation pwa icons...');

  proj.run(`ngx-pwa-icons --icon ./${config.pathes.logoPng}`, { output: false }).sync();
  // proj.run(` pwa-asset-generator ./${config.pathes.logoSvg} -f --icon-only `, { output: false }).sync();

  Helpers.info('DONE');

  if (exit) {
    process.exit(0);
  }

}


export default {
  $BRANDING
}


export function faviconsDesc() {
  return {
    "masterPicture": config.pathes.logoSvg,
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
