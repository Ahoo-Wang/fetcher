---
next: false
title: 'decorator 公开符号索引'
description: '完整根入口导出、行为契约及源码位置索引。'
---

# decorator 公开符号索引

已知符号名时从下表定位。安装与入口选择请先看[包概览](./index.md)。

## 公开导出索引 {#exports}

| 符号                               | 契约                                                                  | 源码                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ApiMetadata`                      | [服务与端点](services-and-endpoints.md#apimetadata)                   | [apiDecorator.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L44)                           |
| `ApiMetadataCapable`               | [服务与端点](services-and-endpoints.md#apimetadatacapable)            | [apiDecorator.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L87)                           |
| `API_METADATA_KEY`                 | [元数据与执行生命周期](execution.md#api_metadata_key)                 | [apiDecorator.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L98)                           |
| `buildRequestExecutor`             | [元数据与执行生命周期](execution.md#buildrequestexecutor)             | [apiDecorator.ts:224](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L224)                         |
| `api`                              | [服务与端点](services-and-endpoints.md#api)                           | [apiDecorator.ts:275](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L275)                         |
| `PathCapable`                      | [服务与端点](services-and-endpoints.md#pathcapable)                   | [endpointDecorator.ts:6](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L6)                   |
| `EndpointMetadata`                 | [服务与端点](services-and-endpoints.md#endpointmetadata)              | [endpointDecorator.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L22)                 |
| `ENDPOINT_METADATA_KEY`            | [元数据与执行生命周期](execution.md#endpoint_metadata_key)            | [endpointDecorator.ts:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L36)                 |
| `MethodEndpointMetadata`           | [服务与端点](services-and-endpoints.md#methodendpointmetadata)        | [endpointDecorator.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L40)                 |
| `endpoint`                         | [服务与端点](services-and-endpoints.md#endpoint)                      | [endpointDecorator.ts:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L66)                 |
| `get`                              | [服务与端点](services-and-endpoints.md#get)                           | [endpointDecorator.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L112)               |
| `post`                             | [服务与端点](services-and-endpoints.md#post)                          | [endpointDecorator.ts:137](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L137)               |
| `put`                              | [服务与端点](services-and-endpoints.md#put)                           | [endpointDecorator.ts:162](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L162)               |
| `del`                              | [服务与端点](services-and-endpoints.md#del)                           | [endpointDecorator.ts:187](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L187)               |
| `patch`                            | [服务与端点](services-and-endpoints.md#patch)                         | [endpointDecorator.ts:212](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L212)               |
| `head`                             | [服务与端点](services-and-endpoints.md#head)                          | [endpointDecorator.ts:240](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L240)               |
| `options`                          | [服务与端点](services-and-endpoints.md#options)                       | [endpointDecorator.ts:265](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L265)               |
| `EndpointReturnType`               | [元数据与执行生命周期](execution.md#endpointreturntype)               | [endpointReturnTypeCapable.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointReturnTypeCapable.ts#L14) |
| `EndpointReturnTypeCapable`        | [元数据与执行生命周期](execution.md#endpointreturntypecapable)        | [endpointReturnTypeCapable.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointReturnTypeCapable.ts#L19) |
| `ExecuteLifeCycle`                 | [元数据与执行生命周期](execution.md#executelifecycle)                 | [executeLifeCycle.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/executeLifeCycle.ts#L23)                   |
| `FunctionMetadata`                 | [元数据与执行生命周期](execution.md#functionmetadata)                 | [functionMetadata.ts:108](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/functionMetadata.ts#L108)                 |
| `AutoGenerated`                    | [服务与端点](services-and-endpoints.md#autogenerated)                 | [generated.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/generated.ts#L25)                                 |
| `autoGeneratedError`               | [服务与端点](services-and-endpoints.md#autogeneratederror)            | [generated.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/generated.ts#L41)                                 |
| `ParameterType`                    | [参数绑定](parameters.md#parametertype)                               | [parameterDecorator.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L19)               |
| `ParameterMetadata`                | [参数绑定](parameters.md#parametermetadata)                           | [parameterDecorator.ts:136](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L136)             |
| `PARAMETER_METADATA_KEY`           | [参数绑定](parameters.md#parameter_metadata_key)                      | [parameterDecorator.ts:172](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L172)             |
| `parameter`                        | [参数绑定](parameters.md#parameter)                                   | [parameterDecorator.ts:212](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L212)             |
| `path`                             | [参数绑定](parameters.md#path)                                        | [parameterDecorator.ts:279](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L279)             |
| `query`                            | [参数绑定](parameters.md#query)                                       | [parameterDecorator.ts:311](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L311)             |
| `header`                           | [参数绑定](parameters.md#header)                                      | [parameterDecorator.ts:343](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L343)             |
| `body`                             | [参数绑定](parameters.md#body)                                        | [parameterDecorator.ts:361](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L361)             |
| `ParameterRequest`                 | [参数绑定](parameters.md#parameterrequest)                            | [parameterDecorator.ts:373](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L373)             |
| `request`                          | [参数绑定](parameters.md#request)                                     | [parameterDecorator.ts:393](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L393)             |
| `attribute`                        | [参数绑定](parameters.md#attribute)                                   | [parameterDecorator.ts:429](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L429)             |
| `getParameterNames`                | [参数绑定](parameters.md#getparameternames)                           | [reflection.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L55)                               |
| `getParameterName`                 | [参数绑定](parameters.md#getparametername)                            | [reflection.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L101)                             |
| `DECORATOR_TARGET_ATTRIBUTE_KEY`   | [元数据与执行生命周期](execution.md#decorator_target_attribute_key)   | [requestExecutor.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/requestExecutor.ts#L17)                     |
| `DECORATOR_METADATA_ATTRIBUTE_KEY` | [元数据与执行生命周期](execution.md#decorator_metadata_attribute_key) | [requestExecutor.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/requestExecutor.ts#L18)                     |
| `RequestExecutor`                  | [元数据与执行生命周期](execution.md#requestexecutor)                  | [requestExecutor.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/requestExecutor.ts#L61)                     |
