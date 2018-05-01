/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}


declare module '!sass-variable-loader!*' {
  const contents: string;
  export = contents;
}


declare module '!file-loader!*' {
  const contents: string;
  export = contents;
}
