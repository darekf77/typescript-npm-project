import {
  ID_LOADER_PRE_BOOTSTRAP,
  PRE_LOADER_NG_IF_INITED,
} from '../inside-struct-constants';

export function imageLoader(
  pathToLoaderImageInAssets: string,
  preloader = false,
) {
  return `
<style>
  .taon-image-pre-loader {
    display: block;
    position: absolute;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
  }
  .taon-image-ngbootstrap-loader {
    display: block;
    position: absolute;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
  }
</style>

<img  src="${pathToLoaderImageInAssets}" ${preloader ? ID_LOADER_PRE_BOOTSTRAP : PRE_LOADER_NG_IF_INITED}  class="taon-image-${preloader ? 'pre' : 'ngbootstrap'}-loader">

  `;
}
