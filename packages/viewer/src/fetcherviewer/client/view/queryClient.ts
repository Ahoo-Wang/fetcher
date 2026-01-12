import { QueryClientFactory, QueryClientOptions, ResourceAttributionPathSpec } from "@ahoo-wang/fetcher-wow";
import { ViewAggregatedFields, ViewCreated, ViewEdited } from "./types";
import { VIEWER_BOUNDED_CONTEXT_ALIAS } from "../boundedContext";
import { ViewState } from '../../../viewer';

const DEFAULT_QUERY_CLIENT_OPTIONS: QueryClientOptions = {
    contextAlias: VIEWER_BOUNDED_CONTEXT_ALIAS,
    aggregateName: 'view',
    resourceAttribution: ResourceAttributionPathSpec.TENANT,
};

export enum ViewDomainEventTypeMapTitle {
    view_created = '视图已创建',
    view_edited = '视图已修改'
}

export type ViewDomainEventType = ViewCreated | ViewEdited;

export const viewQueryClientFactory = new QueryClientFactory<ViewState, ViewAggregatedFields | string, ViewDomainEventType>(DEFAULT_QUERY_CLIENT_OPTIONS);
