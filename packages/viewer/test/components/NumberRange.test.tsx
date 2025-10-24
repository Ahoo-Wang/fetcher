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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberRange } from '../../src';

describe('NumberRange', () => {
  it('renders two InputNumber components', () => {
    render(<NumberRange />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
  });

  it('displays default values correctly', () => {
    render(<NumberRange defaultValue={[10, 20]} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('10');
    expect(inputs[1].value).toBe('20');
  });

  it('shows custom placeholders', () => {
    render(<NumberRange placeholder={['开始', '结束']} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0].getAttribute('placeholder')).toBe('开始');
    expect(inputs[1].getAttribute('placeholder')).toBe('结束');
  });

  it('uses default placeholders when not provided', () => {
    render(<NumberRange />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0].getAttribute('placeholder')).toBe('最小值');
    expect(inputs[1].getAttribute('placeholder')).toBe('最大值');
  });

  it('calls onChange when start value changes', () => {
    const onChange = vi.fn();
    render(<NumberRange onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '15' } });

    expect(onChange).toHaveBeenCalledWith([15, undefined]);
  });

  it('calls onChange when end value changes', () => {
    const onChange = vi.fn();
    render(<NumberRange onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '25' } });

    expect(onChange).toHaveBeenCalledWith([undefined, 25]);
  });

  it('maintains both values when both are set', () => {
    const onChange = vi.fn();
    render(<NumberRange defaultValue={[10, 20]} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '15' } });

    expect(onChange).toHaveBeenCalledWith([15, 20]);
  });

  it('accepts min and max props', () => {
    // Test that props are accepted without error
    expect(() => render(<NumberRange min={0} max={100} />)).not.toThrow();
  });

  it('accepts precision prop', () => {
    // Test that precision prop is accepted without error
    expect(() => render(<NumberRange precision={2} />)).not.toThrow();
  });

  it('handles dynamic value changes correctly', () => {
    const onChange = vi.fn();
    render(<NumberRange defaultValue={[10, 20]} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');

    // Change start value
    fireEvent.change(inputs[0], { target: { value: '15' } });
    expect(onChange).toHaveBeenCalledWith([15, 20]);

    // Change end value
    fireEvent.change(inputs[1], { target: { value: '25' } });
    expect(onChange).toHaveBeenCalledWith([15, 25]);
  });

  it('handles null values (clearing inputs)', () => {
    const onChange = vi.fn();
    render(<NumberRange defaultValue={[10, 20]} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    // Simulate clearing the input (antd InputNumber behavior)
    fireEvent.change(inputs[0], { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith([undefined, 20]);
  });
});
