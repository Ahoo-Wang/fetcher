import { ParsedOpenAPI } from '../parser/openapiParser';
import { Project, SourceFile, InterfaceDeclaration } from 'ts-morph';
import { resolve } from 'path';
import { Schema, Reference } from '@ahoo-wang/fetcher-openapi';

// Wow 内置类型映射
export const IMPORT_WOW_PATH = '@ahoo-wang/fetcher-wow';

export const WOW_TYPE_MAPPING: { [key: string]: string } = {
  'wow.command.CommandResult': 'CommandResult',
  'wow.MessageHeaderSqlType': 'MessageHeaderSqlType',
  'wow.api.BindingError': 'BindingError',
  'wow.api.DefaultErrorInfo': 'ErrorInfo',
  'wow.api.command.DefaultDeleteAggregate': 'DeleteAggregate',
  'wow.api.command.DefaultRecoverAggregate': 'RecoverAggregate',
  'wow.api.messaging.FunctionInfoData': 'FunctionInfo',
  'wow.api.messaging.FunctionKind': 'FunctionKind',
  'wow.api.modeling.AggregateId': 'AggregateId',
  'wow.api.query.Condition': 'Condition',
  'wow.api.query.ListQuery': 'ListQuery',
  'wow.api.query.Operator': 'Operator',
  'wow.api.query.PagedQuery': 'PagedQuery',
  'wow.api.query.Pagination': 'Pagination',
  'wow.api.query.Projection': 'Projection',
  'wow.api.query.Sort': 'FieldSort',
  'wow.api.query.Sort.Direction': 'SortDirection',
  'wow.command.CommandStage': 'CommandStage',
  'wow.command.SimpleWaitSignal': 'WaitSignal',
  'wow.configuration.Aggregate': 'Aggregate',
  'wow.configuration.BoundedContext': 'BoundedContext',
  'wow.configuration.WowMetadata': 'WowMetadata',
  'wow.modeling.DomainEvent': 'DomainEvent',
  'wow.openapi.BatchResult': 'BatchResult',
};

/**
 * 生成数据模型接口
 * @param openapi 解析后的 OpenAPI 对象
 * @param outputPath 输出路径
 */
export function generateSchemas(
  openapi: ParsedOpenAPI,
  outputPath: string,
): void {
  if (!openapi.components || !openapi.components.schemas) {
    return;
  }

  const project = new Project();
  const schemaEntries = Object.entries(openapi.components.schemas);

  // 按模块组织接口
  const moduleMap = new Map<
    string,
    { sourceFile: SourceFile; interfaces: InterfaceDeclaration[] }
  >();

  // 收集需要导入的 Wow 类型
  const wowImports = new Set<string>();

  for (const [schemaKey, schemaRef] of schemaEntries) {
    // 检查是否为 Wow 内置类型
    if (schemaKey.startsWith('wow.')) {
      const wowType = WOW_TYPE_MAPPING[schemaKey];
      if (wowType) {
        wowImports.add(wowType);
      }
      continue;
    }

    // 类型守卫，确保是 Schema 而不是 Reference
    if (!isSchema(schemaRef)) {
      continue;
    }

    const schema = schemaRef as Schema;

    // 确定模块路径和接口名称
    const { modulePath, interfaceName } = parseSchemaKey(schemaKey);

    // 获取或创建源文件
    let moduleInfo = moduleMap.get(modulePath);
    if (!moduleInfo) {
      const fullPath = resolve(outputPath, modulePath, 'types.ts');
      const sourceFile = project.createSourceFile(fullPath, '', {
        overwrite: true,
      });
      moduleInfo = { sourceFile, interfaces: [] };
      moduleMap.set(modulePath, moduleInfo);
    }

    // 生成接口
    const interfaceDeclaration = moduleInfo.sourceFile.addInterface({
      name: interfaceName,
      isExported: true,
    });

    // 添加属性
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        if (propSchema) {
          const type = generateType(propSchema, wowImports);
          interfaceDeclaration.addProperty({
            name: propName,
            type,
            hasQuestionToken: schema.required?.includes(propName) === false,
          });
        }
      });
    }

    moduleInfo.interfaces.push(interfaceDeclaration);
  }

  // 添加 Wow 导入语句
  if (wowImports.size > 0) {
    for (const moduleInfo of moduleMap.values()) {
      moduleInfo.sourceFile.addImportDeclaration({
        namedImports: Array.from(wowImports),
        moduleSpecifier: IMPORT_WOW_PATH,
      });
    }
  }

  // 保存所有文件
  project.saveSync();
}

/**
 * 类型守卫，检查是否为 Schema 对象
 * @param schema Schema 或 Reference 对象
 * @returns 是否为 Schema 对象
 */
function isSchema(schema: Schema | Reference | undefined): boolean {
  if (!schema) return false;
  return !('$ref' in schema);
}

/**
 * 解析 Schema Key，确定模块路径和接口名称
 * @param schemaKey Schema 键名
 * @returns 模块路径和接口名称
 */
function parseSchemaKey(schemaKey: string): {
  modulePath: string;
  interfaceName: string;
} {
  const parts = schemaKey.split('.');

  // 找到第一个大写字母开头的部分作为接口名称的开始
  let interfaceStartIndex = parts.length;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i][0] >= 'A' && parts[i][0] <= 'Z') {
      interfaceStartIndex = i;
      break;
    }
  }

  // 如果没有找到大写字母开头的部分，或者第一部分就是大写，则作为根级接口
  if (interfaceStartIndex === parts.length || interfaceStartIndex === 0) {
    const interfaceName = parts
      .map((part, index) => {
        if (index === 0 || part[0] < 'A' || part[0] > 'Z') {
          return part;
        }
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
    return { modulePath: '.', interfaceName };
  }

  // 模块路径为接口名称之前的部分
  const modulePath = parts.slice(0, interfaceStartIndex).join('/');

  // 接口名称为从接口开始部分到最后的部分，首字母大写并连接
  const interfaceName = parts
    .slice(interfaceStartIndex)
    .map((part, index) => {
      if (index === 0) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');

  return { modulePath, interfaceName };
}

/**
 * 生成 TypeScript 类型
 * @param schema Schema 对象
 * @param wowImports Wow 导入集合
 * @returns TypeScript 类型字符串
 */
function generateType(schema: any, wowImports: Set<string>): string {
  if (!schema || typeof schema !== 'object') {
    return 'any';
  }

  // 引用类型
  if (schema.$ref) {
    const refPath = schema.$ref;
    if (refPath.startsWith('#/components/schemas/')) {
      const schemaName = refPath.substring('#/components/schemas/'.length);
      // 检查是否为 Wow 类型
      if (schemaName.startsWith('wow.')) {
        const wowType = WOW_TYPE_MAPPING[schemaName];
        if (wowType) {
          wowImports.add(wowType);
          return wowType;
        }
      }
      // 普通引用类型，需要根据实际模块组织调整
      return schemaName;
    }
  }

  // 枚举类型
  if (schema.enum) {
    return schema.enum
      .map((value: any) => (typeof value === 'string' ? `"${value}"` : value))
      .join(' | ');
  }

  // 数组类型
  if (schema.type === 'array') {
    if (schema.items) {
      const itemType = generateType(schema.items, wowImports);
      return `${itemType}[]`;
    }
    return 'any[]';
  }

  // 对象类型
  if (schema.type === 'object') {
    if (schema.properties) {
      const properties = Object.entries(schema.properties).map(
        ([key, value]) => {
          const valueType = generateType(value, wowImports);
          const required = schema.required?.includes(key) ? '' : '?';
          return `${key}${required}: ${valueType}`;
        },
      );
      return `{ ${properties.join('; ')} }`;
    }
    return 'Record<string, any>';
  }

  // 基本类型映射
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    default:
      return 'any';
  }
}
