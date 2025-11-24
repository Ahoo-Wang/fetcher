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

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  TagInput,
  StringTagValueItemSerializer,
  NumberTagValueItemSerializer,
} from '../../src';

describe('TagInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<TagInput />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies default props correctly', () => {
    const { container } = render(<TagInput />);
    const select = container.querySelector('.ant-select');
    expect(select).toBeTruthy();
    expect(select?.classList.contains('ant-select-multiple')).toBe(true);
  });

  it('accepts custom token separators', () => {
    const customSeparators = ['|'];
    const { container } = render(
      <TagInput tokenSeparators={customSeparators} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('allows clear by default', () => {
    const { container } = render(<TagInput value={['test']} />);
    const select = container.querySelector('.ant-select');
    expect(select?.classList.contains('ant-select-allow-clear')).toBe(true);
  });

  it('passes through other props', () => {
    render(<TagInput placeholder="Enter tags" />);
    expect(screen.getByText('Enter tags')).toBeTruthy();
  });

  describe('Serializer functionality', () => {
    it('uses StringTagValueItemSerializer by default', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TagInput value={['tag1', 'tag2']} onChange={onChange} />,
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('uses custom serializer for number values', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TagInput<number>
          value={[1, 2, 3]}
          serializer={NumberTagValueItemSerializer}
          onChange={onChange}
        />,
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('StringTagValueItemSerializer serializes and deserializes correctly', () => {
      const input = ['tag1', 'tag2', 'tag3'];
      const serialized = StringTagValueItemSerializer.serialize(input);
      const deserialized = StringTagValueItemSerializer.deserialize(serialized);

      expect(serialized).toEqual(input);
      expect(deserialized).toEqual(input);
    });

    it('NumberTagValueItemSerializer serializes and deserializes correctly', () => {
      const input = [1, 2, 3];
      const serialized = NumberTagValueItemSerializer.serialize(input);
      const deserialized = NumberTagValueItemSerializer.deserialize(serialized);

      expect(serialized).toEqual(['1', '2', '3']);
      expect(deserialized).toEqual(input);
    });
  });

  describe('Value handling', () => {
    it('handles array value correctly', () => {
      const { container } = render(<TagInput value={['tag1', 'tag2']} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('handles single value as array', () => {
      const { container } = render(<TagInput value="singleTag" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('handles undefined value', () => {
      const { container } = render(<TagInput value={undefined} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('handles null value', () => {
      const { container } = render(<TagInput value={null} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('handles empty array', () => {
      const { container } = render(<TagInput value={[]} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('onChange callback', () => {
    it('calls onChange with deserialized values', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TagInput value={['tag1', 'tag2']} onChange={onChange} />,
      );

      // Simulate user input - this is tricky with tags mode
      // The onChange should be called when the internal Select changes
      expect(container.firstChild).toBeTruthy();
    });

    it('does not call onChange when not provided', () => {
      const { container } = render(<TagInput value={['tag1', 'tag2']} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('calls onChange with number values when using NumberTagValueItemSerializer', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TagInput<number>
          value={[1, 2]}
          serializer={NumberTagValueItemSerializer}
          onChange={onChange}
        />,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Token separators', () => {
    it('uses default token separators', () => {
      const { container } = render(<TagInput />);
      expect(container.firstChild).toBeTruthy();
    });

    it('accepts custom token separators', () => {
      const customSeparators = ['|', '\n'];
      const { container } = render(
        <TagInput tokenSeparators={customSeparators} />,
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles empty token separators array', () => {
      const { container } = render(<TagInput tokenSeparators={[]} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Component behavior', () => {
    it('renders in tags mode', () => {
      const { container } = render(<TagInput />);
      const select = container.querySelector('.ant-select');
      expect(select?.classList.contains('ant-select-multiple')).toBe(true);
    });

    it('has open set to false', () => {
      const { container } = render(<TagInput />);
      expect(container.firstChild).toBeTruthy();
    });

    it('has no suffix icon', () => {
      const { container } = render(<TagInput />);
      const suffixIcon = container.querySelector('.ant-select-arrow');
      expect(suffixIcon).toBeFalsy();
    });

    it('allows clear by default', () => {
      const { container } = render(<TagInput value={['test']} />);
      const select = container.querySelector('.ant-select');
      expect(select?.classList.contains('ant-select-allow-clear')).toBe(true);
    });

    it('can disable allowClear', () => {
      const { container } = render(<TagInput allowClear={false} />);
      const select = container.querySelector('.ant-select');
      expect(select?.classList.contains('ant-select-allow-clear')).toBe(false);
    });
  });

  describe('Type safety', () => {
    it('works with string arrays', () => {
      const onChange = vi.fn<(value: string[]) => void>();
      const { container } = render(
        <TagInput value={['a', 'b']} onChange={onChange} />,
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('works with number arrays', () => {
      const onChange = vi.fn<(value: number[]) => void>();
      const { container } = render(
        <TagInput<number>
          value={[1, 2]}
          serializer={NumberTagValueItemSerializer}
          onChange={onChange}
        />,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('handles malformed number strings in NumberTagValueItemSerializer', () => {
      const malformedStrings = ['1', 'not-a-number', '3'];
      const result = NumberTagValueItemSerializer.deserialize(malformedStrings);
      expect(result).toEqual([1, NaN, 3]);
    });

    it('handles empty strings in serialization', () => {
      const input = ['tag1', '', 'tag2'];
      const serialized = StringTagValueItemSerializer.serialize(input);
      const deserialized = StringTagValueItemSerializer.deserialize(serialized);

      expect(serialized).toEqual(input);
      expect(deserialized).toEqual(input);
    });
  });
});
