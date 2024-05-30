import { _ } from 'tnp-core/src';
import { idsDefault } from './loader-ids-default';
import { idsEllipsis } from './loader-ids-ellipsis';
import { idsFacebook } from './loader-ids-facebook';
import { idsGrid } from './loader-ids-grid';
import { idsHeart } from './loader-ids-heart';
import { idsRipple } from './loader-ids-ripple';
const defaultLoader = 'lds-default';

export function getLoader(
  loaderName = defaultLoader as keyof typeof loaders,
  color?: string,
  preload?: boolean,
) {
  if (_.isString(color)) {
    color = color.replace('##', '');
  }
  const loaders = {
    'lds-default': idsDefault(color, preload),
    'lds-ellipsis': idsEllipsis(color, preload),
    'lds-facebook': idsFacebook(color, preload),
    'lds-grid': idsGrid(color, preload),
    'lds-heart': idsHeart(color, preload),
    'lds-ripple': idsRipple(color, preload),
  };
  return loaders[loaderName ? loaderName : defaultLoader];
}
