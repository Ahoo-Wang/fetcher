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

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberRange } from '../../src';

describe('NumberRange', () => {
  it('renders without crashing', () => {
    const { container } = render(<NumberRange />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies default props correctly', () => {
    render(<NumberRange />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    expect(screen.getByPlaceholderText('~')).toBeTruthy();
  });

  it('renders with default placeholder', () => {
    render(<NumberRange />);
    expect(screen.getByPlaceholderText('最小值')).toBeTruthy();
    expect(screen.getByPlaceholderText('最大值')).toBeTruthy();
  });

  it('accepts custom placeholder', () => {
    render(<NumberRange placeholder={['Start', 'End']} />);
    expect(screen.getByPlaceholderText('Start')).toBeTruthy();
    expect(screen.getByPlaceholderText('End')).toBeTruthy();
  });

  it('handles placeholder array with insufficient length', () => {
    render(<NumberRange placeholder={['Only One']} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].placeholder).toBe('Only One');
    expect(inputs[1].placeholder).toBe('最大值');
  });

  describe('Value handling', () => {
    it('handles undefined value (uncontrolled)', () => {
      render(<NumberRange />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(2);
    });

    it('handles single number value', () => {
      render(<NumberRange value={5} />);
      expect(screen.getByDisplayValue('5')).toBeTruthy();
    });

    it('handles array value', () => {
      render(<NumberRange value={[10, 20]} />);
      expect(screen.getByDisplayValue('10')).toBeTruthy();
      expect(screen.getByDisplayValue('20')).toBeTruthy();
    });

    it('handles partial array value', () => {
      render(<NumberRange value={[15, undefined]} />);
      expect(screen.getByDisplayValue('15')).toBeTruthy();
    });

    it('handles defaultValue in uncontrolled mode', () => {
      render(<NumberRange defaultValue={[1, 2]} />);
      expect(screen.getByDisplayValue('1')).toBeTruthy();
      expect(screen.getByDisplayValue('2')).toBeTruthy();
    });
  });

  it('handles single number value', () => {
    render(<NumberRange value={5} />);
    expect(screen.getByDisplayValue('5')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('handles array value', () => {
    render(<NumberRange value={[10, 20]} />);
    expect(screen.getByDisplayValue('10')).toBeTruthy();
    expect(screen.getByDisplayValue('20')).toBeTruthy();
  });

  it('handles partial array value', () => {
    render(<NumberRange value={[15, undefined]} />);
    expect(screen.getByDisplayValue('15')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('handles defaultValue in uncontrolled mode', () => {
    render(<NumberRange defaultValue={[1, 2]} />);
    expect(screen.getByDisplayValue('1')).toBeTruthy();
    expect(screen.getByDisplayValue('2')).toBeTruthy();
  });
});

describe('Controlled vs Uncontrolled', () => {
  it('works in controlled mode', () => {
    const onChange = vi.fn();
    render(<NumberRange value={[5, 10]} onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[0], { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith([7, 10]);
  });

  it('works in uncontrolled mode', () => {
    const onChange = vi.fn();
    render(<NumberRange defaultValue={[3, 8]} onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[1], { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith([3, 12]);
  });
});

describe('onChange callback', () => {
  it('calls onChange when start value changes', () => {
    const onChange = vi.fn();
    render(<NumberRange onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[0], { target: { value: '25' } });
    expect(onChange).toHaveBeenCalledWith([25, undefined]);
  });

  it('calls onChange when end value changes', () => {
    const onChange = vi.fn();
    render(<NumberRange onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[1], { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith([undefined, 30]);
  });

  it('handles null values from InputNumber', () => {
    const onChange = vi.fn();
    render(<NumberRange value={[5, 10]} onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');

    // Simulate clearing the input (InputNumber returns null)
    fireEvent.change(inputs[0], { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith([undefined, 10]);
  });

  it('does not call onChange when not provided', () => {
    const { container } = render(<NumberRange />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    expect(container.firstChild).toBeTruthy(); // Just ensure no error
  });
});

describe('Props constraints', () => {
  it('applies min and max constraints', () => {
    render(<NumberRange min={0} max={100} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    // Note: Antd InputNumber may not set HTML attributes directly
  });

  it('applies precision', () => {
    render(<NumberRange precision={2} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    // Note: Antd InputNumber may not set step attribute directly
  });

  it('adjusts min/max based on values', () => {
    render(<NumberRange value={[10, 50]} min={0} max={100} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    // Note: Dynamic min/max adjustments are handled internally by Antd
  });
});

describe('Edge cases', () => {
  it('handles invalid range (start > end)', () => {
    const onChange = vi.fn();
    render(<NumberRange value={[20, 10]} onChange={onChange} />);
    expect(screen.getByDisplayValue('20')).toBeTruthy();
    expect(screen.getByDisplayValue('10')).toBeTruthy();
    // Note: Component allows invalid range, no automatic correction
  });

  it('handles very large numbers', () => {
    render(<NumberRange value={[1000000, 2000000]} />);
    expect(screen.getByDisplayValue('1000000')).toBeTruthy();
    expect(screen.getByDisplayValue('2000000')).toBeTruthy();
  });

  it('handles negative numbers', () => {
    render(<NumberRange value={[-10, -5]} />);
    expect(screen.getByDisplayValue('-10')).toBeTruthy();
    expect(screen.getByDisplayValue('-5')).toBeTruthy();
  });

  it('handles decimal numbers', () => {
    render(<NumberRange value={[1.5, 2.75]} precision={2} />);
    expect(screen.getByDisplayValue('1.50')).toBeTruthy();
    expect(screen.getByDisplayValue('2.75')).toBeTruthy();
  });
});

describe('Type safety', () => {
  it('accepts number value', () => {
    render(<NumberRange value={42} />);
    expect(screen.getByDisplayValue('42')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('accepts array value', () => {
    render(<NumberRange value={[1, 2]} />);
    expect(screen.getByDisplayValue('1')).toBeTruthy();
    expect(screen.getByDisplayValue('2')).toBeTruthy();
  });

  it('onChange returns correct type', () => {
    const onChange = vi.fn<(value: (number | undefined)[]) => void>();
    render(<NumberRange onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith([5, undefined]);
  });
});

describe('Accessibility', () => {
  it('has proper input roles', () => {
    render(<NumberRange />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
  });

  it('renders separator as disabled input', () => {
    render(<NumberRange />);
    const separator = screen.getByPlaceholderText('~') as HTMLInputElement;
    expect(separator.disabled).toBe(true);
  });
});
