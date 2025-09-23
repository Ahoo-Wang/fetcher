/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Reference, Schema } from '@ahoo-wang/fetcher-openapi';
import { ModelDefinition } from '@/model/modelDefinition.ts';
import { ModuleInfoResolver } from '@/module/moduleInfoResolver.ts';
import { DependencyDefinition } from '@/module/dependencyDefinition.ts';
import { isReference, getSchemaKey } from '@/utils.ts';
import { WOW_TYPE_MAPPING, IMPORT_WOW_PATH } from '@/model/wowTypeMapping.ts';

export class ModelResolver {
  constructor(private readonly moduleInfoResolver: ModuleInfoResolver) {
  }

  resolve(key: string, schema: Schema): ModelDefinition {
    // Check if this is a Wow type that should be mapped
    const wowType = this.resolveWowType(key);
    if (wowType) {
      return {
        name: wowType,
        title: schema.title,
        description: schema.description,
        isReference: true,
        dependencies: [
          {
            moduleSpecifier: IMPORT_WOW_PATH,
            namedImports: new Set([wowType]),
          },
        ],
        type: 'object',
      };
    }

    const moduleInfo = this.moduleInfoResolver.resolve(key);

    if (!schema.properties && schema.type !== 'object') {
      // Handle non-object schemas (like enums, primitives used as models)
      return {
        name: moduleInfo.name,
        title: schema.title,
        description: schema.description,
        isReference: false,
        dependencies: [],
        type: this.resolveType(schema),
      };
    }

    if (!schema.properties) {
      return {
        name: moduleInfo.name,
        title: schema.title,
        description: schema.description,
        isReference: false,
        dependencies: [],
        type: schema.type || 'object',
      };
    }

    const { properties, dependencies } = this.resolveProperties(schema);

    return {
      name: moduleInfo.name,
      title: schema.title,
      description: schema.description,
      isReference: false,
      dependencies,
      properties,
      type: schema.type || 'object',
    };
  }

  resolveProperties(schema: Schema): {
    properties: Map<string, string>;
    dependencies: DependencyDefinition[];
  } {
    const properties = new Map<string, string>();
    const dependencies: DependencyDefinition[] = [];

    if (!schema.properties) {
      return { properties, dependencies };
    }

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const propType = this.resolveType(propSchema);
      properties.set(propName, propType);

      // Collect dependencies recursively from the property schema
      const propDependencies = this.collectDependencies(propSchema);
      this.mergeDependencies(dependencies, propDependencies);
    }

    return { properties, dependencies };
  }

  resolveType(schema: Schema | Reference): string {
    if (isReference(schema)) {
      const schemaKey = getSchemaKey(schema.$ref);

      // Check if it's a Wow type
      const wowType = this.resolveWowType(schemaKey);
      if (wowType) {
        return wowType;
      }

      // Otherwise, resolve to the interface name
      const moduleInfo = this.moduleInfoResolver.resolve(schemaKey);
      return moduleInfo.name;
    }

    const s = schema as Schema;

    // Handle union types (oneOf, anyOf, allOf)
    if (s.oneOf) {
      const types = s.oneOf.map(subSchema => this.resolveType(subSchema));
      const uniqueTypes = [...new Set(types)];
      return uniqueTypes.join(' | ');
    }

    if (s.anyOf) {
      const types = s.anyOf.map(subSchema => this.resolveType(subSchema));
      const uniqueTypes = [...new Set(types)];
      return uniqueTypes.join(' | ');
    }

    if (s.allOf) {
      // For allOf, we typically want to extend the first type
      if (s.allOf.length > 0) {
        return this.resolveType(s.allOf[0]);
      }
    }

    // Handle arrays
    if (s.type === 'array') {
      if (s.items) {
        return `${this.resolveType(s.items)}[]`;
      }
      return 'any[]';
    }

    // Handle enums
    if (s.enum && Array.isArray(s.enum)) {
      return s.enum
        .map(value =>
          typeof value === 'string' ? `'${value}'` : value.toString(),
        )
        .join(' | ');
    }

    // Handle primitive types
    if (s.type) {
      if (Array.isArray(s.type)) {
        return s.type.map(type => {
          switch (type) {
            case 'integer':
              return 'number';
            case 'null':
              return 'null';
            default:
              return type;
          }
        }).join(' | ');
      }

      switch (s.type) {
        case 'integer':
          return 'number';
        case 'null':
          return 'null';
        default:
          return s.type;
      }
    }

    // Handle objects without explicit type
    if (s.properties) {
      return 'object';
    }

    return 'any';
  }

  resolveReference(schema: Reference): DependencyDefinition {
    const schemaKey = getSchemaKey(schema.$ref);

    // Check if it's a Wow type
    const wowType = this.resolveWowType(schemaKey);
    if (wowType) {
      return {
        moduleSpecifier: IMPORT_WOW_PATH,
        namedImports: new Set([wowType]),
      };
    }

    const moduleInfo = this.moduleInfoResolver.resolve(schemaKey);
    return {
      moduleSpecifier: moduleInfo.path,
      namedImports: new Set([moduleInfo.name]),
    };
  }

  private collectDependencies(schema: Schema | Reference): DependencyDefinition[] {
    const dependencies: DependencyDefinition[] = [];

    if (isReference(schema)) {
      const dependency = this.resolveReference(schema as Reference);
      dependencies.push(dependency);
    } else {
      const s = schema as Schema;

      // Handle arrays
      if (s.type === 'array' && s.items) {
        const itemDeps = this.collectDependencies(s.items);
        this.mergeDependencies(dependencies, itemDeps);
      }

      // Handle union types
      if (s.oneOf) {
        s.oneOf.forEach(subSchema => {
          const subDeps = this.collectDependencies(subSchema);
          this.mergeDependencies(dependencies, subDeps);
        });
      }

      if (s.anyOf) {
        s.anyOf.forEach(subSchema => {
          const subDeps = this.collectDependencies(subSchema);
          this.mergeDependencies(dependencies, subDeps);
        });
      }

      if (s.allOf) {
        s.allOf.forEach(subSchema => {
          const subDeps = this.collectDependencies(subSchema);
          this.mergeDependencies(dependencies, subDeps);
        });
      }

      // Handle properties
      if (s.properties) {
        for (const propSchema of Object.values(s.properties)) {
          const propDeps = this.collectDependencies(propSchema);
          this.mergeDependencies(dependencies, propDeps);
        }
      }
    }

    return dependencies;
  }

  private mergeDependencies(target: DependencyDefinition[], source: DependencyDefinition[]): void {
    for (const dep of source) {
      const existingDep = target.find(
        d => d.moduleSpecifier === dep.moduleSpecifier,
      );
      if (existingDep) {
        dep.namedImports.forEach(name => existingDep.namedImports.add(name));
      } else {
        target.push(dep);
      }
    }
  }
  private resolveWowType(schemaKey: string): string | null {
    return (WOW_TYPE_MAPPING as any)[schemaKey] || null;
  }
}
