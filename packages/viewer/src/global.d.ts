// 声明 .module.css 模块的类型
declare module '*.module.css' {
  const classes: { [key: string]: string }; // 键是类名，值是编译后的唯一类名
  export default classes;
}

// 如果项目还用到 .module.scss/.module.less，补充对应声明
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}
