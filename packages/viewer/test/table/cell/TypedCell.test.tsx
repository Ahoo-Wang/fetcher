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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { typedCellRender } from '../../../src';
import { TEXT_CELL_TYPE } from '../../../src';
import React from 'react';

// Wrapper component for testing renderer functions
const RendererWrapper: React.FC<{
  renderer: any;
  value: any;
  record: any;
  index: number;
}> = ({ renderer, value, record, index }) => {
  return <>{renderer(value, record, index)}</>;
};

describe('typedCellRender', () => {
  it('should return a renderer function for registered type', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();
    expect(typeof renderer).toBe('function');
  });

  it('should return undefined for unregistered type', () => {
    const renderer = typedCellRender('unregistered-type');
    expect(renderer).toBeUndefined();
  });

  it('should render text cell correctly when called', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Hello World"
        record={{ id: 1 }}
        index={0}
      />,
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should pass attributes to the cell component', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE, { ellipsis: true });
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Long text that should be truncated"
        record={{ id: 1 }}
        index={0}
      />,
    );

    const textElement = screen.getByText('Long text that should be truncated');
    expect(textElement).toHaveClass('ant-typography-ellipsis');
  });

  it('should handle number value', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value={123}
        record={{ id: 1 }}
        index={0}
      />,
    );
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should handle null value', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    const { container } = render(
      <RendererWrapper
        renderer={renderer}
        value={null}
        record={{ id: 1 }}
        index={0}
      />,
    );
    const textElement = container.querySelector('.ant-typography');
    expect(textElement?.textContent).toBe('');
  });

  it('should handle empty string', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    const { container } = render(
      <RendererWrapper
        renderer={renderer}
        value=""
        record={{ id: 1 }}
        index={0}
      />,
    );
    const textElement = container.querySelector('.ant-typography');
    expect(textElement?.textContent).toBe('');
  });

  it('should pass record and index correctly', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    const record = { name: 'John', age: 30 };
    render(
      <RendererWrapper
        renderer={renderer}
        value="Test"
        record={record}
        index={5}
      />,
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle zero index', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Zero"
        record={{ id: 1 }}
        index={0}
      />,
    );

    expect(screen.getByText('Zero')).toBeInTheDocument();
  });

  it('should handle large index', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Large"
        record={{ id: 1 }}
        index={999999}
      />,
    );

    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('should handle negative index', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Negative"
        record={{ id: 1 }}
        index={-1}
      />,
    );

    expect(screen.getByText('Negative')).toBeInTheDocument();
  });

  it('should handle empty record object', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Empty Record"
        record={{}}
        index={0}
      />,
    );

    expect(screen.getByText('Empty Record')).toBeInTheDocument();
  });

  it('should handle complex record object', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    const complexRecord = {
      id: 1,
      name: 'Complex',
      nested: { prop: 'value' },
      array: [1, 2, 3],
    };
    render(
      <RendererWrapper
        renderer={renderer}
        value="Complex"
        record={complexRecord}
        index={0}
      />,
    );

    expect(screen.getByText('Complex')).toBeInTheDocument();
  });

  it('should handle empty attributes', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE, {});
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Empty Attr"
        record={{ id: 1 }}
        index={0}
      />,
    );

    expect(screen.getByText('Empty Attr')).toBeInTheDocument();
  });

  it('should handle undefined attributes', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE, undefined);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Undefined Attr"
        record={{ id: 1 }}
        index={0}
      />,
    );

    expect(screen.getByText('Undefined Attr')).toBeInTheDocument();
  });

  it('should handle null attributes', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE, null as any);
    expect(renderer).toBeDefined();

    render(
      <RendererWrapper
        renderer={renderer}
        value="Null Attr"
        record={{ id: 1 }}
        index={0}
      />,
    );

    expect(screen.getByText('Null Attr')).toBeInTheDocument();
  });

  it('should handle array value', () => {
    const renderer = typedCellRender(TEXT_CELL_TYPE);
    expect(renderer).toBeDefined();

    const arr = ['a', 'b', 'c'];
    const { container } = render(
      <RendererWrapper
        renderer={renderer}
        value={arr}
        record={{ id: 1 }}
        index={0}
      />,
    );
    const textElement = container.querySelector('.ant-typography');
    expect(textElement?.textContent).toBe('abc');
  });

  it('should handle edge case: empty string type', () => {
    const renderer = typedCellRender('');
    expect(renderer).toBeUndefined();
  });

  it('should handle edge case: null type', () => {
    const renderer = typedCellRender(null as any);
    expect(renderer).toBeUndefined();
  });

  it('should handle edge case: undefined type', () => {
    const renderer = typedCellRender(undefined as any);
    expect(renderer).toBeUndefined();
  });

  it('should handle edge case: numeric type', () => {
    const renderer = typedCellRender(123 as any);
    expect(renderer).toBeUndefined();
  });

  it('should handle edge case: object type', () => {
    const renderer = typedCellRender({} as any);
    expect(renderer).toBeUndefined();
  });

  it('should handle edge case: array type', () => {
    const renderer = typedCellRender([] as any);
    expect(renderer).toBeUndefined();
  });
});
