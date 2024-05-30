import {
  ID_LOADER_PRE_BOOTSTRAP,
  PRE_LOADER_NG_IF_INITED,
} from '../inside-struct-constants';

export function idsFacebook(color = '#8d8d8d', preloader = false) {
  return `
<style>
  .lds-facebook {
    display: block;
    position: absolute;
    width: 80px;
    height: 80px;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
  }
  .lds-facebook div {
    display: inline-block;
    position: absolute;
    left: 8px;
    width: 16px;
    background: ${color};
    animation: lds-facebook 1.2s cubic-bezier(0, 0.5, 0.5, 1) infinite;
  }
  .lds-facebook div:nth-child(1) {
    left: 8px;
    animation-delay: -0.24s;
  }
  .lds-facebook div:nth-child(2) {
    left: 32px;
    animation-delay: -0.12s;
  }
  .lds-facebook div:nth-child(3) {
    left: 56px;
    animation-delay: 0;
  }
  @keyframes lds-facebook {
    0% {
      top: 8px;
      height: 64px;
    }
    50%, 100% {
      top: 24px;
      height: 32px;
    }
  }
</style>

<div ${preloader ? ID_LOADER_PRE_BOOTSTRAP : PRE_LOADER_NG_IF_INITED}  class="lds-facebook"><div></div><div></div><div></div></div>

  `;
}
