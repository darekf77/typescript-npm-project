import { Models } from "tnp-models";
//#region @backend
console.log('siema')
//#endregion

//#region it will disapperr!
//#region @cutCodeIfTrue true
console.log('hellooo')
//#endregion
//#endregion

//#region @cutCodeIfTrue false
console.log('hellooo')
//#endregion

//#region @cutCodeIfFalse false
console.log('hellooo')
//#endregion

//#region @cutCodeIfFalse true
console.log('hellooo')
//#endregion

//#region @backend
console.log('aaa');
console.log('bbb');
console.log('ccc');
//#endregion

//#region npm
console.log('fsdf');
console.log('dsfg');
//#endregion

export namespace As {
  //#region @notForNpm
  function a() {
    console.log('csdfsdf');
  }

}

//#endregion
export class AA {
  //#region body class

  fun() {
    //#region function
    function init() {
      //#region @backendFunc
      const a = '';
      //#endregion
    }
    //#endregion

    //#region @backend
    function asd() { }
    //#endregion

    console.log('asda');
  }

  a() {
    //#region @backendFunc
    console.log('asda')
    //#endregion
  }

  //#endregion
}
