import { Models } from 'tnp-models';
import { Helpers } from 'tnp-core';

export function codeCuttFn(cutIftrue: boolean) {
  return function (expression: string, reservedExpOne: any, reservedExpSec?: string) {

    const exp = `(function(ENV,absoluteFilePath){
        return ${expression.trim()};
      })(reservedExpOne,reservedExpSec)`;
    try {
      return eval(exp);
    } catch (err) {
      Helpers.log(`Expression Failed`, err)
      Helpers.error(`[codecutFn] Eval failed `, true, true);
      return null;
    }
  };
}
