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

import { Component, type ReactNode } from 'react';
import type {
  FilterComponentProps,
  FilterRegistration,
} from './filterReactTypes.js';
import { Button } from '../components/ui/button.js';
import { message } from './filterPanelUtils.js';

export class EditorSession extends Component<
  FilterComponentProps & { editor: FilterRegistration['component'] }
> {
  private active = true;
  state = {
    editor: this.props.editor,
    operator: this.props.operator,
    mode: this.props.mode,
    generation: {},
  };
  static getDerivedStateFromProps(
    props: EditorSession['props'],
    state: EditorSession['state'],
  ) {
    if (
      props.editor === state.editor &&
      props.operator === state.operator &&
      props.mode === state.mode
    )
      return null;
    return {
      editor: props.editor,
      operator: props.operator,
      mode: props.mode,
      generation: {},
    };
  }
  componentDidMount() {
    this.active = true;
  }
  componentWillUnmount() {
    this.active = false;
  }
  render() {
    const { editor: Editor, ...props } = this.props;
    const generation = this.state.generation;
    const isActive = () => this.active && this.state.generation === generation;
    return (
      <Editor
        {...props}
        onChange={node => {
          if (isActive() && !this.props.disabled) props.onChange(node);
        }}
        onOperatorChange={operator => {
          if (isActive() && !this.props.disabled)
            props.onOperatorChange(operator);
        }}
        onClear={() => {
          if (isActive() && !this.props.disabled) props.onClear();
        }}
        onRemove={() => {
          if (isActive() && !this.props.disabled) props.onRemove();
        }}
        onValidityChange={(valid, message) => {
          if (isActive()) props.onValidityChange(valid, message);
        }}
      />
    );
  }
}
export class EditorBoundary extends Component<
  { children: ReactNode; onError(message: string): void; onFallback(): void },
  { error?: string }
> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: unknown) {
    return { error: message(error) };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(message(error));
  }
  render() {
    return this.state.error ? (
      <Button variant="outline" onClick={this.props.onFallback}>
        使用内置编辑器
      </Button>
    ) : (
      this.props.children
    );
  }
}
