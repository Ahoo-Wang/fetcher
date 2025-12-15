import { CellProps } from './types';
import { Button, MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { ActionCell, ActionCellProps, isActionCellProps } from './ActionCell';
import type * as React from 'react';

/**
 * Constant representing the type identifier for actions cells.
 *
 * This constant is used to register and identify actions cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for actions-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'actions'
 *
 * @example
 * ```tsx
 * import { typedCellRender, ACTIONS_CELL_TYPE } from './table/cell';
 *
 * const actionsRenderer = typedCellRender(ACTIONS_CELL_TYPE, { onClick: () => {} });
 * ```
 */
export const ACTIONS_CELL_TYPE: string = 'actions';

/**
 * Data structure for actions cell configuration.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ActionsData
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const actionsData: ActionsData<User> = {
 *   primaryAction: {
 *     data: { value: "Edit", record: user, index: 0 },
 *     attributes: { onClick: (record) => editUser(record) }
 *   },
 *   moreActionTitle: "More Actions",
 *   secondaryActions: [
 *     {
 *       data: { value: "Delete", record: user, index: 0 },
 *       attributes: { onClick: (record) => deleteUser(record), danger: true }
 *     }
 *   ]
 * };
 * ```
 */
export interface ActionsData<RecordType = any> {
  primaryAction:
    | ActionCellProps<RecordType>
    | ((record: RecordType) => React.ReactNode);
  moreActionTitle?: string;
  secondaryActions:
    | ActionCellProps<RecordType>[]
    | ((record: RecordType) => React.ReactNode[]);
}

/**
 * Props for the ActionsCell component, extending CellProps with ActionsData value type and click handler attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ActionsCellProps
 * @extends CellProps<ActionsData, RecordType, { onClick: (actionKey: string, value: RecordType) => void; }>
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: number;
 *   name: string;
 *   price: number;
 * }
 *
 * const props: ActionsCellProps<Product> = {
 *   data: {
 *     value: {
 *       primaryAction: { data: { value: "Edit", record: product, index: 0 }, attributes: { onClick: editProduct } },
 *       secondaryActions: [{ data: { value: "Delete", record: product, index: 0 }, attributes: { onClick: deleteProduct } }]
 *     },
 *     record: product,
 *     index: 0
 *   },
 *   attributes: { onClick: (actionKey, record) => handleAction(actionKey, record) }
 * };
 * ```
 */
export interface ActionsCellProps<RecordType = any> extends CellProps<
  ActionsData<RecordType>,
  RecordType,
  { onClick: (actionKey: string, value: RecordType) => void }
> {}

/**
 * Renders an actions cell with primary and secondary action buttons using Ant Design components.
 *
 * This component displays multiple action buttons in table cells, with a primary action
 * button and optional secondary actions in a dropdown menu. It uses ActionCell components
 * for individual buttons and provides a clean interface for handling multiple actions.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the actions cell component.
 * @param props.data - The cell data containing ActionsData value, record, and index.
 * @param props.data.value - The actions configuration with primary and secondary actions.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes including click handler.
 * @returns A React element representing the actions cell with buttons and dropdown.
 *
 * @example
 * ```tsx
 * <ActionsCell
 *   data={{
 *     value: {
 *       primaryAction: {
 *         data: { value: "Edit", record: item, index: 0 },
 *         attributes: { onClick: () => editItem(item.id) }
 *       },
 *       moreActionTitle: "Options",
 *       secondaryActions: [
 *         {
 *           data: { value: "Delete", record: item, index: 0 },
 *           attributes: { onClick: () => deleteItem(item.id), danger: true }
 *         }
 *       ]
 *     },
 *     record: item,
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, record) => console.log(actionKey, record)
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
 * interface Task {
 *   id: number;
 *   title: string;
 *   status: string;
 * }
 *
 * <ActionsCell<Task>
 *   data={{
 *     value: {
 *       primaryAction: {
 *         data: { value: "Complete", record: task, index: 0 },
 *         attributes: { onClick: (record) => completeTask(record.id) }
 *       },
 *       secondaryActions: [
 *         {
 *           data: { value: "Archive", record: task, index: 0 },
 *           attributes: { onClick: (record) => archiveTask(record.id) }
 *         }
 *       ]
 *     },
 *     record: task,
 *     index: 0
 *   }}
 * />
 * ```
 */
function renderActions(props: ActionsCellProps) {
  const { data } = props;

  let secondaryButtons: MenuProps['items'] = [];
  if (
    Array.isArray(data.value.secondaryActions) &&
    data.value.secondaryActions.length > 0
  ) {
    const actions: ActionCellProps[] = data.value.secondaryActions;
    secondaryButtons = actions.map(action => {
      return {
        key: action.data.index,
        label: <ActionCell {...action} />,
      };
    });
  }

  if (typeof data.value.secondaryActions === 'function') {
    secondaryButtons = data.value
      .secondaryActions(data.record)
      .map((action, index) => {
        return {
          key: index,
          label: <>{action}</>,
        };
      });
  }

  if (secondaryButtons.length > 0) {
    return (
      <Space>
        {isActionCellProps(data.value.primaryAction) ? (
          <ActionCell {...data.value.primaryAction} />
        ) : (
          <>{data.value.primaryAction(data.record)}</>
        )}

        <Dropdown menu={{ items: secondaryButtons }}>
          <Button type="link" style={{ padding: 0 }}>
            <Space>
              {data.value.moreActionTitle || 'More'}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </Space>
    );
  }

  return (
    <>
      {isActionCellProps(data.value.primaryAction) ? (
        <ActionCell {...data.value.primaryAction} />
      ) : (
        <>{data.value.primaryAction(data.record)}</>
      )}
    </>
  );
}

/**
 * ActionsCell component for rendering multiple action buttons in table cells.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the ActionsCell component.
 * @returns A React element representing the actions cell.
 */
export function ActionsCell<RecordType = any>(
  props: ActionsCellProps<RecordType>,
) {
  return renderActions(props);
}
