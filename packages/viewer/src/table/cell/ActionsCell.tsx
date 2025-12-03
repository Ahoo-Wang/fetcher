import { CellProps } from './types';
import { Button, DropdownProps, MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { ActionCell, ActionCellProps } from './ActionCell';

/**
 * Constant representing the type identifier for actions cells.
 *
 * This constant is used to register and identify actions cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for actions-based table cells that display multiple actions.
 *
 * @constant
 * @type {string}
 * @default 'actions'
 *
 * @example
 * ```tsx
 * import { typedCellRender, ACTIONS_CELL_TYPE } from './table/cell';
 *
 * const actionsRenderer = typedCellRender(ACTIONS_CELL_TYPE, {
 *   onClick: (actionKey, record) => console.log(actionKey, record)
 * });
 * ```
 */
export const ACTIONS_CELL_TYPE: string = 'actions';

/**
 * Data structure for actions cell values.
 *
 * This interface defines the shape of data that actions cells expect to receive.
 * Each actions cell contains a primary action (displayed as a button) and an array
 * of secondary actions (displayed in a dropdown menu).
 *
 * @interface ActionsData
 * @property {ActionCellProps} primaryAction - The main action displayed as a primary button.
 * @property {ActionCellProps[]} secondaryActions - Array of secondary actions shown in dropdown menu.
 *
 * @example
 * ```tsx
 * const actionsData: ActionsData = {
 *   primaryAction: { title: "Edit", key: "edit" },
 *   secondaryActions: [
 *     { title: "Delete", key: "delete" },
 *     { title: "Duplicate", key: "duplicate" }
 *   ]
 * };
 * ```
 */
export interface ActionsData<RecordType = any> {
  primaryAction: ActionCellProps<RecordType>;
  moreActionTitle?: string;
  secondaryActions: ActionCellProps<RecordType>[];
}

/**
 * Props for the ActionsCell component, extending CellProps with ActionsData value type and custom attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ActionsCellProps
 * @extends CellProps<ActionsData, RecordType, { onClick: (actionKey: string, value: RecordType) => void }>
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const props: ActionsCellProps<User> = {
 *   data: {
 *     value: {
 *       primaryAction: { title: "Edit", key: "edit" },
 *       secondaryActions: [
 *         { title: "Delete", key: "delete" },
 *         { title: "View Details", key: "view" }
 *       ]
 *     },
 *     record: { id: 1, name: "John Doe", email: "john@example.com" },
 *     index: 0
 *   },
 *   attributes: {
 *     onClick: (actionKey, user) => console.log(`Action: ${actionKey}`, user),
 *   }
 * };
 * ```
 */
export interface ActionsCellProps<RecordType = any> extends CellProps<
  ActionsData,
  RecordType,
  { onClick: (actionKey: string, value: RecordType) => void }
> {}

function actionRender(props: ActionsCellProps) {
  const { data, attributes } = props;
  console.log('actionRender', data);
  if (data.value.secondaryActions && data.value.secondaryActions.length > 0) {
    const secondaryButtons: MenuProps['items'] =
      data.value.secondaryActions.map(actionProps => {
        return {
          key: actionProps.data.index,
          label: <ActionCell {...actionProps} />,
        };
      });

    return (
      <Space>
        {data.value.primaryAction && (
          <ActionCell {...data.value.primaryAction} />
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

  return <ActionCell {...data.value.primaryAction} />;
}

/**
 * Renders an actions cell using Ant Design's Button and Dropdown components.
 *
 * This component displays multiple interactive actions in table cells with support for
 * various button formatting options provided by Ant Design. It shows a primary action
 * as a button and secondary actions in a dropdown menu. The actions data includes
 * both display titles and unique keys for handling clicks.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the actions cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The actions data with primary and secondary actions.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes to pass to the Button components.
 * @param props.attributes.onClick - The click handler function that receives the action key and record.
 * @returns A React element representing the actions cell, or null if no valid actions data.
 *
 * @example
 * ```tsx
 * <ActionsCell
 *   data={{
 *     value: {
 *       primaryAction: { title: "Edit", key: "edit" },
 *       secondaryActions: [
 *         { title: "Delete", key: "delete" },
 *         { title: "Duplicate", key: "duplicate" }
 *       ]
 *     },
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, user) => console.log('Action:', actionKey),
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript interface and conditional actions
 * interface Product {
 *   id: number;
 *   name: string;
 *   status: 'active' | 'inactive';
 * }
 *
 * <ActionsCell<Product>
 *   data={{
 *     value: {
 *       primaryAction: { title: "Edit", key: "edit" },
 *       secondaryActions: [
 *         { title: "Delete", key: "delete" },
 *         { title: "Archive", key: "archive" }
 *       ]
 *     },
 *     record: { id: 1, name: "Widget", status: "active" },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, product) => {
 *       if (actionKey === 'delete') {
 *         if (confirm(`Delete ${product.name}?`)) {
 *           console.log('Deleting product:', product.id);
 *         }
 *       }
 *     },
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom styling for primary action
 * <ActionsCell
 *   data={{
 *     value: {
 *       primaryAction: { title: "Publish", key: "publish" },
 *       secondaryActions: [
 *         { title: "Save Draft", key: "save" },
 *         { title: "Preview", key: "preview" }
 *       ]
 *     },
 *     record: { id: 1, title: "Article" },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, article) => console.log(actionKey, article),
 *     type: "primary",
 *     style: { background: '#52c41a', borderColor: '#52c41a' }
 *   }}
 * />
 * ```
 */
export function ActionsCell<RecordType = any>(
  props: ActionsCellProps<RecordType>,
) {
  return actionRender(props);
}
