/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, Typography, Space, Divider } from 'antd';
import { RemoteSelect } from '../../RemoteSelect';
import {
  TagInput,
  StringTagValueItemSerializer,
} from '../../TagInput';

/**
 * RemoteSelect component for searching users with debounced search.
 * Fetches from /api/users/search endpoint with 300ms debounce.
 *
 * @example
 * ```tsx
 * // Basic user search
 * <UserSearchSelect
 *   placeholder="Search users..."
 *   onChange={(users) => setSelectedUsers(users)}
 * />
 *
 * // With default values
 * <UserSearchSelect
 *   defaultValue={[{ label: 'John Doe', value: 'user-1' }]}
 *   onChange={(users) => setSelectedUsers(users)}
 * />
 * ```
 */
export interface UserSearchSelectProps {
  /** Placeholder text when no selection is made */
  placeholder?: string;
  /** Callback fired when selection changes */
  onChange?: (users: UserOption[]) => void;
  /** Currently selected users */
  value?: UserOption[];
  /** Allow clearing selection */
  allowClear?: boolean;
  /** Maximum number of users that can be selected */
  maxCount?: number;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * User option type returned from search endpoint
 */
export interface UserOption {
  label: string;
  value: string;
  /** Optional avatar URL */
  avatar?: string;
  /** Optional email address */
  email?: string;
}

/**
 * Fetches users from the search endpoint
 */
const searchUsers = async (keyword: string): Promise<UserOption[]> => {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(keyword)}`);

  if (!response.ok) {
    throw new Error('Failed to search users');
  }

  const users: UserOption[] = await response.json();
  return users;
};

/**
 * RemoteSelect for searching users with 300ms debounce.
 * Displays results with user name as label and user ID as value.
 */
export function UserSearchSelect(props: UserSearchSelectProps) {
  const {
    placeholder = 'Search users...',
    onChange,
    value,
    allowClear = true,
    maxCount,
    disabled,
    style,
  } = props;

  return (
    <RemoteSelect
      placeholder={placeholder}
      search={searchUsers}
      onChange={onChange as any}
      value={value as any}
      allowClear={allowClear}
      maxCount={maxCount}
      disabled={disabled}
      style={style}
      debounce={{
        delay: 300,
        leading: false,
        trailing: true,
      }}
    />
  );
}

/**
 * TagInput component for entering multiple tags with string serialization.
 * Tags are separated by common token separators (comma, semicolon, space).
 *
 * @example
 * ```tsx
 * // Basic tag input
 * <TagsInput
 *   placeholder="Enter tags..."
 *   value={tags}
 *   onChange={(tags) => setTags(tags)}
 * />
 *
 * // With predefined tags
 * <TagsInput
 *   value={['react', 'typescript']}
 *   onChange={(tags) => setTags(tags)}
 * />
 * ```
 */
export interface TagsInputProps {
  /** Placeholder text when no tags are entered */
  placeholder?: string;
  /** Currently entered tags */
  value?: string[];
  /** Callback fired when tags change */
  onChange?: (tags: string[]) => void;
  /** Custom token separators for splitting input into tags */
  tokenSeparators?: string[];
  /** Maximum number of tags allowed */
  maxTagCount?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show clear button */
  allowClear?: boolean;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * TagInput for entering multiple tags with string serialization.
 * Uses StringTagValueItemSerializer which passes strings through unchanged.
 */
export function TagsInput(props: TagsInputProps) {
  const {
    placeholder = 'Enter tags...',
    value = [],
    onChange,
    tokenSeparators = [',', '，', ';', '；', ' '],
    maxTagCount,
    disabled,
    allowClear = true,
    style,
  } = props;

  return (
    <TagInput
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      tokenSeparators={tokenSeparators}
      maxTagCount={maxTagCount}
      disabled={disabled}
      allowClear={allowClear}
      serializer={StringTagValueItemSerializer}
      style={style}
    />
  );
}

// ============================================================================
// Storybook Stories
// ============================================================================

const { Text, Paragraph } = Typography;

/**
 * RemoteSelect story - User search with 300ms debounce
 */
export const RemoteSelectStory: StoryObj = {
  render: () => {
    const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);

    return (
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>User Search (300ms debounce)</Text>
            <Paragraph type="secondary">
              Type to search for users. Results are fetched from /api/users/search
              with a 300ms debounce to reduce server load.
            </Paragraph>
          </div>

          <UserSearchSelect
            placeholder="Search users by name or email..."
            value={selectedUsers}
            onChange={setSelectedUsers}
            style={{ width: '100%' }}
          />

          <Divider>Selected Users</Divider>
          {selectedUsers.length > 0 ? (
            <pre>{JSON.stringify(selectedUsers, null, 2)}</pre>
          ) : (
            <Text type="secondary">No users selected</Text>
          )}
        </Space>
      </Card>
    );
  },
};

/**
 * TagInput story - Multiple tags with string serialization
 */
export const TagInputStory: StoryObj = {
  render: () => {
    const [tags, setTags] = useState<string[]>([]);

    return (
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>Tag Input (String Serialization)</Text>
            <Paragraph type="secondary">
              Enter multiple tags separated by comma, semicolon, or space.
              Tags are serialized as strings.
            </Paragraph>
          </div>

          <TagsInput
            placeholder="Enter tags (e.g., react, typescript, storybook)"
            value={tags}
            onChange={setTags}
            style={{ width: '100%' }}
          />

          <Divider>Current Tags</Divider>
          {tags.length > 0 ? (
            <pre>{JSON.stringify(tags, null, 2)}</pre>
          ) : (
            <Text type="secondary">No tags entered</Text>
          )}
        </Space>
      </Card>
    );
  },
};

// ============================================================================
// Demo Component
// ============================================================================

export interface FormComponentsDemoProps {
  /** Initial selected users */
  initialUsers?: UserOption[];
  /** Initial tags */
  initialTags?: string[];
  /** Callback fired when form values change */
  onChange?: (data: { users: UserOption[]; tags: string[] }) => void;
}

export function FormComponentsDemo(props: FormComponentsDemoProps) {
  const {
    initialUsers = [],
    initialTags = [],
    onChange,
  } = props;

  const [users, setUsers] = useState<UserOption[]>(initialUsers);
  const [tags, setTags] = useState<string[]>(initialTags);

  const handleUsersChange = (newUsers: UserOption[]) => {
    setUsers(newUsers);
    onChange?.({ users: newUsers, tags });
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    onChange?.({ users, tags: newTags });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="User Search">
        <UserSearchSelect
          value={users}
          onChange={handleUsersChange}
          placeholder="Search and select users..."
          style={{ width: '100%' }}
        />
      </Card>

      <Card title="Tag Input">
        <TagsInput
          value={tags}
          onChange={handleTagsChange}
          placeholder="Enter tags separated by comma, space, or semicolon..."
          style={{ width: '100%' }}
        />
      </Card>
    </Space>
  );
}
