import { ID_LOADER_PRE_BOOTSTRAP, PRE_LOADER_NG_IF_INITED } from "../inside-struct-constants";

export function imageLoader(src: string, preloader = false) {
  return `
<style>
  .firedev-ui-image-pre-loader {
    display: block;
    position: absolute;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
  }
  .firedev-ui-image-ngbootstrap-loader {
    display: block;
    position: absolute;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
  }
</style>

<img  src="${src}" ${preloader ? ID_LOADER_PRE_BOOTSTRAP : PRE_LOADER_NG_IF_INITED}  class="firedev-ui-image-${preloader ? 'pre' : 'ngbootstrap'}-loader">

  `
}
