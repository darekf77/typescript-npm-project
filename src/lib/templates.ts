export const EXPORT_TEMPLATE = (folder = 'lib') =>
  `
// import def from './${folder}';
export * from './${folder}';
// export default def;
        `.trimLeft();
