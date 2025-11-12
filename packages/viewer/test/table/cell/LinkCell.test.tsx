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
import { LinkCell } from '../../../src';

describe('LinkCell', () => {
  it('should render link text correctly', () => {
    const props = {
      data: {
        value: 'Click Here',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<LinkCell {...props} />);
    expect(screen.getByText('Click Here')).toBeInTheDocument();
  });

  it('should render as anchor element', () => {
    const props = {
      data: {
        value: 'Link Text',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement?.tagName).toBe('A');
  });

  it('should apply href attribute', () => {
    const props = {
      data: {
        value: 'Visit Site',
        record: { id: 1 },
        index: 0,
      },
      attributes: { href: 'https://example.com' },
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
  });

  it('should apply target attribute', () => {
    const props = {
      data: {
        value: 'Open in New Tab',
        record: { id: 1 },
        index: 0,
      },
      attributes: { href: '#', target: '_blank' },
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('should apply rel attribute for security', () => {
    const props = {
      data: {
        value: 'External Link',
        record: { id: 1 },
        index: 0,
      },
      attributes: {
        href: 'https://external.com',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render empty string', () => {
    const props = {
      data: {
        value: '',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement?.textContent).toBe('');
  });

  it('should render special characters', () => {
    const specialText = 'Special: & < > " \' / \\';
    const props = {
      data: {
        value: specialText,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<LinkCell {...props} />);
    expect(screen.getByText(specialText)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const props = {
      data: {
        value: 'Custom Class',
        record: { id: 1 },
        index: 0,
      },
      attributes: { className: 'custom-link-class' },
    };

    render(<LinkCell {...props} />);
    const linkElement = screen.getByText('Custom Class');
    expect(linkElement).toHaveClass('custom-link-class');
  });

  it('should apply style attribute', () => {
    const props = {
      data: {
        value: 'Styled Link',
        record: { id: 1 },
        index: 0,
      },
      attributes: { style: { color: 'red', fontSize: '14px' } },
    };

    render(<LinkCell {...props} />);
    const linkElement = screen.getByText('Styled Link');
    expect(linkElement).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      fontSize: '14px',
    });
  });

  it('should handle numeric value converted to string', () => {
    const props = {
      data: {
        value: 123 as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<LinkCell {...props} />);
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should handle null value (renders empty)', () => {
    const props = {
      data: {
        value: null as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement?.textContent).toBe('');
  });

  it('should handle undefined value (renders empty)', () => {
    const props = {
      data: {
        value: undefined as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement?.textContent).toBe('');
  });

  it('should render with different record types', () => {
    const props = {
      data: {
        value: 'Test Link',
        record: { name: 'John', url: 'https://example.com' },
        index: 5,
      },
      attributes: { href: 'https://example.com' },
    };

    render(<LinkCell {...props} />);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('should render with zero index', () => {
    const props = {
      data: {
        value: 'Zero Index Link',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<LinkCell {...props} />);
    expect(screen.getByText('Zero Index Link')).toBeInTheDocument();
  });

  it('should render with large index', () => {
    const props = {
      data: {
        value: 'Large Index Link',
        record: { id: 1 },
        index: 999999,
      },
      attributes: {},
    };

    render(<LinkCell {...props} />);
    expect(screen.getByText('Large Index Link')).toBeInTheDocument();
  });

  it('should apply multiple attributes', () => {
    const props = {
      data: {
        value: 'Multi Attr Link',
        record: { id: 1 },
        index: 0,
      },
      attributes: {
        href: 'https://example.com',
        target: '_blank',
        className: 'multi-class',
        style: { color: 'blue' },
        title: 'Link tooltip',
      },
    };

    render(<LinkCell {...props} />);
    const linkElement = screen.getByText('Multi Attr Link');
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveClass('multi-class');
    expect(linkElement).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    expect(linkElement).toHaveAttribute('title', 'Link tooltip');
  });

  it('should handle disabled state', () => {
    const props = {
      data: {
        value: 'Disabled Link',
        record: { id: 1 },
        index: 0,
      },
      attributes: { disabled: true },
    };

    const { container } = render(<LinkCell {...props} />);
    const linkElement = container.querySelector('a');
    expect(linkElement).toHaveClass('ant-typography-disabled');
  });
});
