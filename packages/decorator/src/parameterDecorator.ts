import { getParameterName } from './reflection';
import 'reflect-metadata';

/**
 * Parameter types for decorator parameters
 */
export enum ParameterType {
  PATH = 'path',
  QUERY = 'query',
  HEADER = 'header',
  BODY = 'body',
}

/**
 * Metadata for method parameters
 */
export interface ParameterMetadata {
  /**
   * Type of parameter (path, query, header, body)
   */
  type: ParameterType;

  /**
   * Name of the parameter (used for path, query, and header parameters)
   */
  name?: string;

  /**
   * Index of the parameter in the method signature
   */
  index: number;
}

export const PARAMETER_METADATA_KEY = Symbol('parameter:metadata');

export function parameter(type: ParameterType, name: string | undefined = undefined) {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    const paramName = getParameterName(
      target,
      propertyKey,
      parameterIndex,
      name,
    );

    const existingParameters: ParameterMetadata[] =
      Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];

    existingParameters.push({
      type: type,
      name: paramName,
      index: parameterIndex,
    });

    Reflect.defineMetadata(
      PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      propertyKey,
    );
  };
}

export function path(name: string | undefined = undefined) {
  return parameter(ParameterType.PATH, name);
}

export function query(name: string | undefined = undefined) {
  return parameter(ParameterType.QUERY, name);
}

export function header(name: string | undefined = undefined) {
  return parameter(ParameterType.HEADER, name);
}

export function body() {
  return parameter(ParameterType.BODY);
}