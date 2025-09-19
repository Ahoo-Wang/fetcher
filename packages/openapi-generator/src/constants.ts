export const IMPORT_WOW_PATH = '@ahoo-wang/fetcher-wow';

export const WOW_TYPE_MAPPING = {
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

export const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
  'trace',
] as const;
