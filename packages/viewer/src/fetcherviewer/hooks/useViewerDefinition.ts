import { aggregateId, } from '@ahoo-wang/fetcher-wow';
import { viewerDefinitionQueryClientFactory } from '../client';
import type { ViewDefinition } from '../../';
import {  useSingleQuery } from '@ahoo-wang/fetcher-react';

/**
 * useViewerDefinition Hook 返回结果类型
 */
export interface UseViewerDefinitionResult {
  viewerDefinition: ViewDefinition | undefined;
  loading: boolean;
  error: Error | undefined;
}

const snapshotQueryClient =
viewerDefinitionQueryClientFactory.createSnapshotQueryClient();

/**
 * 获取视图定义的 Hook
 * 
 * 为什么使用 useSingleQuery 而不是 useEffect:
 * 
 * 1. **避免重复渲染**: useEffect 在组件挂载和依赖变化时会执行，
 *    可能导致多次不必要的查询和数据更新
 * 
 * 2. **内置状态管理**: useSingleQuery 自动管理 loading、error、data 状态，
 *    减少手动 setState 的样板代码
 * 
 * 3. **缓存机制**: useSingleQuery 内置查询缓存，相同查询不会重复发起请求
 */
export function useViewerDefinition(
  viewerDefinitionId: string,
): UseViewerDefinitionResult {
  const {result: definition, loading, error} = useSingleQuery<ViewDefinition>({
    initialQuery: {condition: aggregateId(viewerDefinitionId)},
    execute: (query) => snapshotQueryClient.singleState(query)
  })

  return {viewerDefinition: definition, loading, error};
}