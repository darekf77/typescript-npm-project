
// export class Helpers {
//   static isBrowser = !!(typeof window !== 'undefined' && window.document);
//   static isNode = (function () {
//     Helpers.isNode = !Helpers.isBrowser;
//     return Helpers.isNode;
//   })() as boolean;

// }


// console.log('isBrowser', Helpers.isBrowser)
// console.log('isNOde', Helpers.isNode)


export namespace Models {

  export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'JSONP';
}

export namespace Models {

  export type ParamType = 'Path' | 'Query' | 'Cookie' | 'Header' | 'Body';
}

let d: Models.HttpMethod;


let a: Models.ParamType

console.log('a')
