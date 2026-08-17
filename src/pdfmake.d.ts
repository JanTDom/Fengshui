declare module "pdfmake/build/pdfmake" {
  const pdfMake: any;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfsFonts: Record<string, string>;
  export default vfsFonts;
}
