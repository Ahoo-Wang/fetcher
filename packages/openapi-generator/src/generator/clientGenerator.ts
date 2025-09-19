import { ParsedOpenAPI } from '../parser/openapiParser';
import { Project, SourceFile, InterfaceDeclaration } from 'ts-morph';
import { resolve } from 'path';
import { Operation, PathItem } from '@ahoo-wang/fetcher-openapi';

/**
 * 生成 API 客户端接口
 * @param openapi 解析后的 OpenAPI 对象
 * @param outputPath 输出路径
 */
export function generateClients(
  openapi: ParsedOpenAPI,
  outputPath: string,
): void {
  if (!openapi.paths) {
    return;
  }

  const project = new Project();
  const pathEntries = Object.entries(openapi.paths);

  // 按模块组织客户端接口
  const moduleMap = new Map<
    string,
    { sourceFile: SourceFile; interfaces: InterfaceDeclaration[] }
  >();

  for (const [path, pathItem] of pathEntries) {
    if (!pathItem) continue;

    // 遍历所有 HTTP 方法
    const operations = getOperations(pathItem);
    for (const [method, operation] of operations) {
      if (!operation) continue;

      // 获取标签，如果没有标签则使用默认标签
      const tags =
        operation.tags && operation.tags.length > 0
          ? operation.tags
          : ['default'];

      for (const tag of tags) {
        // 确定模块路径和接口名称
        const { modulePath, interfaceName } = parseTag(tag);

        // 获取或创建源文件
        let moduleInfo = moduleMap.get(modulePath);
        if (!moduleInfo) {
          const fileName =
            modulePath === '.'
              ? `${interfaceName}Client.ts`
              : `${modulePath}/${interfaceName}Client.ts`;
          const fullPath = resolve(outputPath, fileName);
          const sourceFile = project.createSourceFile(fullPath, '', {
            overwrite: true,
          });
          moduleInfo = { sourceFile, interfaces: [] };
          moduleMap.set(modulePath, moduleInfo);

          // 添加必要的导入
          sourceFile.addImportDeclaration({
            namedImports: ['ApiClient'],
            moduleSpecifier: '@ahoo-wang/fetcher-decorator',
          });
        }

        // 查找或创建接口
        let interfaceDeclaration = moduleInfo.interfaces.find(
          iface => iface.getName() === interfaceName,
        );
        if (!interfaceDeclaration) {
          interfaceDeclaration = moduleInfo.sourceFile.addInterface({
            name: interfaceName,
            isExported: true,
            extends: ['ApiClient'],
          });
          moduleInfo.interfaces.push(interfaceDeclaration);
        }

        // 生成方法签名
        const methodName =
          operation.operationId || `${method}${path.replace(/\//g, '')}`;
        const returnType = operation.responses?.['200'] ? 'any' : 'void';
        interfaceDeclaration.addMethod({
          name: methodName,
          returnType,
          isAsync: true,
        });
      }
    }
  }

  // 保存所有文件
  project.saveSync();
}

/**
 * 获取 PathItem 中的所有操作
 * @param pathItem PathItem 对象
 * @returns 操作映射
 */
function getOperations(pathItem: PathItem): [string, Operation | undefined][] {
  return [
    ['get', pathItem.get],
    ['put', pathItem.put],
    ['post', pathItem.post],
    ['delete', pathItem.delete],
    ['options', pathItem.options],
    ['head', pathItem.head],
    ['patch', pathItem.patch],
    ['trace', pathItem.trace],
  ];
}

/**
 * 解析标签，确定模块路径和接口名称
 * @param tag 标签
 * @returns 模块路径和接口名称
 */
function parseTag(tag: string): { modulePath: string; interfaceName: string } {
  const parts = tag.split('.');

  // 如果只有一个部分或者没有点号，则作为根级接口
  if (parts.length === 1) {
    const interfaceName =
      parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + 'Client';
    return { modulePath: '.', interfaceName };
  }

  // 最后一个部分作为接口名称
  const interfaceName =
    parts[parts.length - 1].charAt(0).toUpperCase() +
    parts[parts.length - 1].slice(1) +
    'Client';

  // 其余部分作为模块路径
  const modulePath = parts.slice(0, parts.length - 1).join('/');

  return { modulePath, interfaceName };
}
