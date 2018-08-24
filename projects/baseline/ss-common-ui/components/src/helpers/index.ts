export * from './sass';
export * from './base-component';


export function stringifyToQueryParams(params, questionMarkAtBegin = false) {
  return Object.keys(params).map(key => key + '=' + params[key]).join('&');
}
