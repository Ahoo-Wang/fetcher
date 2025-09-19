import { OpenAPI } from '@ahoo-wang/fetcher-openapi';
import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import { resolve } from 'path';

export interface ParsedOpenAPI extends OpenAPI {
  $refs: Map<string, any>;
}

/**
 * 解析 OpenAPI 规范文件
 * @param inputPath OpenAPI 规范文件路径
 * @returns 解析后的 OpenAPI 对象
 */
export function parseOpenAPI(inputPath: string): ParsedOpenAPI {
  const absolutePath = resolve(inputPath);
  const fileContent = readFileSync(absolutePath, 'utf8');

  let openapi: OpenAPI;

  if (absolutePath.endsWith('.yaml') || absolutePath.endsWith('.yml')) {
    openapi = yaml.load(fileContent) as OpenAPI;
  } else {
    openapi = JSON.parse(fileContent);
  }

  // 验证是否为有效的 OpenAPI 3.x 规范
  if (!openapi.openapi || !openapi.openapi.startsWith('3.')) {
    throw new Error(
      'Invalid OpenAPI specification. Only OpenAPI 3.x is supported.',
    );
  }

  // 初始化 $refs 映射
  const parsedOpenAPI: ParsedOpenAPI = {
    ...openapi,
    $refs: new Map<string, any>(),
  };

  // 解析 $ref 引用
  resolveRefs(parsedOpenAPI, parsedOpenAPI);

  return parsedOpenAPI;
}

/**
 * 递归解析 $ref 引用
 * @param obj 当前对象
 * @param root 根对象
 */
function resolveRefs(obj: any, root: ParsedOpenAPI): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    obj.forEach(item => resolveRefs(item, root));
    return;
  }

  // 处理 $ref 引用
  if (obj.$ref) {
    const refPath = obj.$ref;
    if (!root.$refs.has(refPath)) {
      const resolved = resolveRef(root, refPath);
      root.$refs.set(refPath, resolved);
    }
    // 将引用替换为实际内容
    Object.assign(obj, root.$refs.get(refPath));
    delete obj.$ref;
  }

  // 递归处理对象属性
  Object.keys(obj).forEach(key => {
    resolveRefs(obj[key], root);
  });
}

/**
 * 解析单个 $ref 引用
 * @param root 根对象
 * @param refPath 引用路径
 * @returns 解析后的对象
 */
function resolveRef(root: ParsedOpenAPI, refPath: string): any {
  if (!refPath.startsWith('#/')) {
    throw new Error(`External references are not supported: ${refPath}`);
  }

  const parts = refPath.substring(2).split('/');
  let current: any = root;

  for (const part of parts) {
    // 处理特殊字符编码
    const decodedPart = decodeURIComponent(
      part.replace(/~1/g, '/').replace(/~0/g, '~'),
    );
    if (!current[decodedPart]) {
      throw new Error(`Reference not found: ${refPath}`);
    }
    current = current[decodedPart];
  }

  // 深拷贝避免引用问题
  return JSON.parse(JSON.stringify(current));
}
