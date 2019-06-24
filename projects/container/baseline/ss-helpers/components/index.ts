export * from './sass';
export * from './base-component';
export * from './base-formly-component';
export * from './dual-component-ctrl';
export * from './resize-service';

export function stringifyToQueryParams(params, questionMarkAtBegin = false) {
  return Object.keys(params).map(key => key + '=' + params[key]).join('&');
}
