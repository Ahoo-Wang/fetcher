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
| `ApiMetadata`                      | [服务与端点](services-and-endpoints.md#apimetadata)                   | [apiDecorator.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L41)                           |
| `ApiMetadataCapable`               | [服务与端点](services-and-endpoints.md#apimetadatacapable)            | [apiDecorator.ts:84](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L84)                           |
| `API_METADATA_KEY`                 | [元数据与执行生命周期](execution.md#api_metadata_key)                 | [apiDecorator.ts:91](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L91)                           |
| `buildRequestExecutor`             | [元数据与执行生命周期](execution.md#buildrequestexecutor)             | [apiDecorator.ts:193](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L193)                         |
| `api`                              | [服务与端点](services-and-endpoints.md#api)                           | [apiDecorator.ts:259](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L259)                         |
| `PathCapable`                      | [服务与端点](services-and-endpoints.md#pathcapable)                   | [endpointDecorator.ts:6](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L6)                   |
| `EndpointMetadata`                 | [服务与端点](services-and-endpoints.md#endpointmetadata)              | [endpointDecorator.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L22)                 |
| `ENDPOINT_METADATA_KEY`            | [元数据与执行生命周期](execution.md#endpoint_metadata_key)            | [endpointDecorator.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L32)                 |
| `MethodEndpointMetadata`           | [服务与端点](services-and-endpoints.md#methodendpointmetadata)        | [endpointDecorator.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L34)                 |
| `endpoint`                         | [服务与端点](services-and-endpoints.md#endpoint)                      | [endpointDecorator.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L60)                 |
| `get`                              | [服务与端点](services-and-endpoints.md#get)                           | [endpointDecorator.ts:103](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L103)               |
| `post`                             | [服务与端点](services-and-endpoints.md#post)                          | [endpointDecorator.ts:128](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L128)               |
| `put`                              | [服务与端点](services-and-endpoints.md#put)                           | [endpointDecorator.ts:153](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L153)               |
| `del`                              | [服务与端点](services-and-endpoints.md#del)                           | [endpointDecorator.ts:178](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L178)               |
| `patch`                            | [服务与端点](services-and-endpoints.md#patch)                         | [endpointDecorator.ts:203](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L203)               |
| `head`                             | [服务与端点](services-and-endpoints.md#head)                          | [endpointDecorator.ts:231](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L231)               |
| `options`                          | [服务与端点](services-and-endpoints.md#options)                       | [endpointDecorator.ts:256](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointDecorator.ts#L256)               |
| `EndpointReturnType`               | [元数据与执行生命周期](execution.md#endpointreturntype)               | [endpointReturnTypeCapable.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointReturnTypeCapable.ts#L14) |
| `EndpointReturnTypeCapable`        | [元数据与执行生命周期](execution.md#endpointreturntypecapable)        | [endpointReturnTypeCapable.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/endpointReturnTypeCapable.ts#L19) |
| `ExecuteLifeCycle`                 | [元数据与执行生命周期](execution.md#executelifecycle)                 | [executeLifeCycle.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/executeLifeCycle.ts#L23)                   |
| `FunctionMetadata`                 | [元数据与执行生命周期](execution.md#functionmetadata)                 | [functionMetadata.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/functionMetadata.ts#L88)                   |
| `AutoGenerated`                    | [服务与端点](services-and-endpoints.md#autogenerated)                 | [generated.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/generated.ts#L25)                                 |
| `autoGeneratedError`               | [服务与端点](services-and-endpoints.md#autogeneratederror)            | [generated.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/generated.ts#L41)                                 |
| `ParameterType`                    | [参数绑定](parameters.md#parametertype)                               | [parameterDecorator.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L19)               |
| `ParameterMetadata`                | [参数绑定](parameters.md#parametermetadata)                           | [parameterDecorator.ts:136](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L136)             |
| `PARAMETER_METADATA_KEY`           | [参数绑定](parameters.md#parameter_metadata_key)                      | [parameterDecorator.ts:168](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L168)             |
| `parameter`                        | [参数绑定](parameters.md#parameter)                                   | [parameterDecorator.ts:206](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L206)             |
| `path`                             | [参数绑定](parameters.md#path)                                        | [parameterDecorator.ts:273](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L273)             |
| `query`                            | [参数绑定](parameters.md#query)                                       | [parameterDecorator.ts:305](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L305)             |
| `header`                           | [参数绑定](parameters.md#header)                                      | [parameterDecorator.ts:337](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L337)             |
| `body`                             | [参数绑定](parameters.md#body)                                        | [parameterDecorator.ts:355](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L355)             |
| `ParameterRequest`                 | [参数绑定](parameters.md#parameterrequest)                            | [parameterDecorator.ts:367](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L367)             |
| `request`                          | [参数绑定](parameters.md#request)                                     | [parameterDecorator.ts:387](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L387)             |
| `attribute`                        | [参数绑定](parameters.md#attribute)                                   | [parameterDecorator.ts:423](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L423)             |
| `getParameterNames`                | [参数绑定](parameters.md#getparameternames)                           | [reflection.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L51)                               |
| `getParameterName`                 | [参数绑定](parameters.md#getparametername)                            | [reflection.ts:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L97)                               |
| `DECORATOR_TARGET_ATTRIBUTE_KEY`   | [元数据与执行生命周期](execution.md#decorator_target_attribute_key)   | [requestExecutor.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/requestExecutor.ts#L17)                     |
| `DECORATOR_METADATA_ATTRIBUTE_KEY` | [元数据与执行生命周期](execution.md#decorator_metadata_attribute_key) | [requestExecutor.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/requestExecutor.ts#L18)                     |
| `RequestExecutor`                  | [元数据与执行生命周期](execution.md#requestexecutor)                  | [requestExecutor.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/requestExecutor.ts#L61)                     |
