

export namespace dummyfiles {
  export function file_src_index_ts(index: string | number  = '') {
    return `
  export function dummyFun${index}():string { return void 0;  };
  export default function() {
    console.log('hello from default index="${index}"');
  }`.trim() + '\n'
  }

  export function file_dist_lib_index_d_ts(index: string | number = '') {
    return `
export declare function dummyFun${index}(): string;
export default function (): void;

  `.trim() + '\n'
  }


  export function file_dist_lib_index_js(index: string | number  = '') {
    return `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyFun${index} = void 0;
function dummyFun${index}() { return void 0; }
exports.dummyFun${index} = dummyFun${index};
;
function default_1() {
  console.log('hello from default index="${index}"');
}
exports.default = default_1;

`.trim() + '\n'
  }


  export function file_dist_lib_index_js_async_change(index: string | number  = '') {
    return `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyFun${index} = void 0;
function dummyFun${index}() { return 'hello'; }
exports.dummyFun${index} = dummyFun${index};
;
function default_1() {
  console.log('hello from default index="${index}"');
}
exports.default = default_1;

`.trim() + '\n'
  }


  export function file_dist_lib_index_js_map(index: string | number  = '') {
    return `
{ "version": 3, "file": "index.js", "sourceRoot": "", "sources": ["../tmp-source-dist/index.ts"], "names": [], "mappings": ";;;AAAA,6BAAwB;AACxB,qDAAsB;AACtB,kBAAe,aAAG,CAAC" }

`.trim() + '\n'
  }

}



