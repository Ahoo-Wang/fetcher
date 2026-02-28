import { CellProps } from './types';
import { Button, ButtonProps } from 'antd';

/**
 * Constant representing the type identifier for action cells.
 *
 * This constant is used to register and identify action cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for action-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'action'
 *
 * @example
 * ```tsx
 * import { typedCellRender, ACTION_CELL_TYPE } from './table/cell';
 *
 * const actionRenderer = typedCellRender(ACTION_CELL_TYPE, { onClick: () => {} });
 * ```
 */
export const ACTION_CELL_TYPE: string = 'action';

/**
 * Props for the ActionCell component, extending CellProps with string value type and ButtonProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ActionCellProps
 * @extends CellProps<string, RecordType, Omit<ButtonProps, 'onClick'> & { onClick?: (record: RecordType) => void; }>
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const props: ActionCellProps<User> = {
 *   data: {
 *     value: "Edit",
 *     record: { id: 1, name: "John Doe", email: "john@example.com" },
 *     index: 0
 *   },
 *   attributes: { onClick: (record) => console.log('Edit user:', record) }
 * };
 * ```
 */
export interface ActionCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  Omit<ButtonProps, 'onClick'> & {
    onClick?: (record: RecordType) => void;
  }
> {}

export function isActionCellProps(obj: any): obj is ActionCellProps {
  return (
    typeof obj.data === 'object' &&
    typeof obj.data.value === 'string' &&
    typeof obj.data.record === 'object' &&
    typeof obj.data.index === 'number' &&
    (obj.attributes === undefined || typeof obj.attributes === 'object')
  );
}

/**
 * Renders an action button cell using Ant Design's Button component.
 *
 * This component displays clickable action buttons in table cells with support for
 * various button styling options provided by Ant Design's Button. It handles
 * the rendering of action buttons while allowing customization through attributes
 * like disabled, loading, size, and other ButtonProps.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the action cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The string value to display as the button text.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes to pass to Button component.
 * @returns A React element representing the action button cell, or null if no value is provided.
 *
 * @example
 * ```tsx
 * <ActionCell
 *   data={{
 *     value: "Delete",
 *     record: { id: 1, name: "Item Name", status: "active" },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (record) => handleDelete(record.id),
 *     danger: true
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
 * interface ActionItem {
 *   id: number;
 *   label: string;
 *   action: string;
 * }
 *
 * <ActionCell<ActionItem>
 *   data={{
 *     value: "View Details",
 *     record: { id: 1, label: "Item 1", action: "view" },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (record) => navigateToDetails(record.id),
 *     type: "primary"
 *   }}
 * />
 * ```
 */
export function ActionCell<RecordType = any>(
  props: ActionCellProps<RecordType>,
) {
  // Extract data and attributes from props for easier access
  const { data, attributes } = props;

  // Early return if no value is provided - prevents rendering empty or meaningless buttons
  if (!data.value) {
    return null;
  }

  // Render the action button with link styling for a clean, unobtrusive appearance
  return (
    <Button
      type="link" // Ant Design link button provides subtle styling without heavy borders
      {...attributes} // Spread additional button props (e.g., disabled, loading, size)
      onClick={() => attributes?.onClick?.(data.record)} // Invoke handler with action key and full record context
      style={{ padding: 0, height: '22px' }}
    >
      {data.value}
    </Button>
  );
}
