import { ID_LOADER_PRE_BOOTSTRAP, PRE_LOADER_NG_IF_INITED } from "../inside-struct-constants";

export function idsEllipsis(color = '#8d8d8d', preloader = false) {
  return `
<style>
  .lds-ellipsis {
    display: block;
    position: absolute;
    width: 80px;
    height: 80px;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
  }
  .lds-ellipsis div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: ${color};
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }
  .lds-ellipsis div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3 0.6s infinite;
  }
  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
</style>

<div ${preloader ? ID_LOADER_PRE_BOOTSTRAP : PRE_LOADER_NG_IF_INITED}  class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>

  `
}
