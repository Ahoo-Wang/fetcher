import { CellProps } from './types';
import { Button, ButtonProps } from 'antd';

/**
 * Constant representing the action cell type identifier.
 * Used to distinguish action cells from other cell types in table configurations.
 * This value can be used in table column definitions to specify that a column
 * should render ActionCell components.
 */
export const ACTION_CELL_TYPE = 'action';

/**
 * Data structure for action cell values.
 *
 * This interface defines the shape of data that action cells expect to receive.
 * Each action is represented by a title (display text) and a key (unique identifier).
 *
 * @interface ActionData
 * @property {string} title - The display text for the action button.
 * @property {string} key - The unique identifier for the action, used in click handlers.
 *
 * @example
 * ```tsx
 * const editAction: ActionData = {
 *   title: "Edit",
 *   key: "edit"
 * };
 *
 * const deleteAction: ActionData = {
 *   title: "Delete",
 *   key: "delete"
 * };
 * ```
 */
export interface ActionData {
  title: string;
  key: string;
}

/**
 * Props for the ActionCell component, extending CellProps with ActionData value type and custom ButtonProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ActionCellProps
 * @extends CellProps<ActionData, RecordType, Omit<ButtonProps, 'onClick'> & { onClick: (actionKey: string, value: RecordType) => void }>
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
 *     value: { title: "Edit", key: "edit" },
 *     record: { id: 1, name: "John Doe", email: "john@example.com" },
 *     index: 0
 *   },
 *   attributes: {
 *     onClick: (actionKey, user) => console.log(`Action: ${actionKey}`, user),
 *     disabled: false
 *   }
 * };
 * ```
 */
export interface ActionCellProps<RecordType = any>
  extends CellProps<
    ActionData,
    RecordType,
    Omit<ButtonProps, 'onClick'> & {
      onClick: (actionKey: string, value: RecordType) => void;
    }
  > {}

/**
 * Renders an action cell using Ant Design's Button component.
 *
 * This component displays interactive action buttons in table cells with support for
 * various button formatting options provided by Ant Design's Button. It allows
 * customization through attributes like disabled, loading, danger, and other ButtonProps.
 * The action data includes both a display title and a unique key for handling clicks.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the action cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The action data with title and key.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes to pass to the Button component.
 * @param props.attributes.onClick - The click handler function that receives the action key and record.
 * @returns A React element representing the action cell, or null if no valid action data.
 *
 * @example
 * ```tsx
 * <ActionCell
 *   data={{
 *     value: { title: "Edit", key: "edit" },
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, user) => console.log('Edit user:', user),
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript interface and styling
 * interface Product {
 *   id: number;
 *   name: string;
 *   price: number;
 * }
 *
 * <ActionCell<Product>
 *   data={{
 *     value: { title: "Delete", key: "delete" },
 *     record: { id: 1, name: "Widget", price: 29.99 },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, product) => {
 *       if (confirm(`Delete ${product.name}?`)) {
 *         console.log('Deleting product:', product.id);
 *       }
 *     },
 *     danger: true,
 *     disabled: false
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With conditional rendering
 * interface Task {
 *   id: number;
 *   title: string;
 *   completed: boolean;
 * }
 *
 * <ActionCell<Task>
 *   data={{
 *     value: { title: "Complete", key: "complete" },
 *     record: { id: 1, title: "Review PR", completed: false },
 *     index: 0
 *   }}
 *   attributes={{
 *     onClick: (actionKey, task) => {
 *       console.log('Completing task:', task.id);
 *     },
 *     loading: false
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
  // This check uses optional chaining to handle both null/undefined and empty strings
  if (!data.value || !data.value.title?.trim()) {
    return null;
  }

  // Extract our custom onClick handler and spread the rest as Button props
  // const onClick = attributes?.onClick;
  // const buttonProps = Omit<typeof attributes, 'onClick'>;

  // Render the action button with link styling for a clean, unobtrusive appearance
  return (
    <Button
      type="link" // Ant Design link button provides subtle styling without heavy borders
      {...attributes} // Spread additional button props (e.g., disabled, loading, size)
      onClick={() => attributes?.onClick?.(data.value.key, data.record)} // Invoke handler with full record context
    >
      {data.value.title}
    </Button>
  );
}
