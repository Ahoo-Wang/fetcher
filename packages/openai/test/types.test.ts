import { describe, it, expectTypeOf } from 'vitest';
import type { ChatRequest, ChatTool, ChatToolChoice, Choice, Message } from '../src';

/**
 * Type-level contract tests for the OpenAI Chat Completions request.
 *
 * The real check happens at compile time (tsc --noEmit / vitest --typecheck);
 * at runtime expectTypeOf is a no-op so the suite stays green either way.
 *
 * BUGS covered:
 * - `seen` was a typo for the OpenAI `seed` parameter (silently ignored by the API)
 * - `logit_bias` only accepted `null` instead of a token-id → bias map
 * - `stop` only accepted a single string instead of string | string[]
 * - `tools` was typed as string[] instead of tool objects
 * - `model` was optional although the API requires it
 * - `tool_choice` was an object map although the API also accepts 'none' | 'auto'
 */
describe('ChatRequest types', () => {
  it('should use the OpenAI `seed` parameter name', () => {
    expectTypeOf<ChatRequest['seed']>().toEqualTypeOf<number | undefined>();
    // @ts-expect-error - the old typo `seen` must no longer exist
    expectTypeOf<ChatRequest['seen']>().toBeUnknown();
  });

  it('should type logit_bias as a token-id to bias map', () => {
    expectTypeOf<ChatRequest['logit_bias']>().toEqualTypeOf<
      Record<string, number> | null | undefined
    >();
  });

  it('should require the model parameter', () => {
    expectTypeOf<ChatRequest['model']>().toEqualTypeOf<string>();
  });

  it('should accept a string or an array of strings for stop', () => {
    expectTypeOf<ChatRequest['stop']>().toEqualTypeOf<
      string | string[] | null | undefined
    >();
  });

  it('should type tools as tool objects, not strings', () => {
    expectTypeOf<ChatRequest['tools']>().toEqualTypeOf<
      ChatTool[] | undefined
    >();
    expectTypeOf<ChatTool['type']>().toEqualTypeOf<'function'>();
    expectTypeOf<ChatTool['function']['name']>().toEqualTypeOf<string>();
  });

  it('should accept none/auto literals or a function specifier for tool_choice', () => {
    expectTypeOf<ChatRequest['tool_choice']>().toEqualTypeOf<
      ChatToolChoice | undefined
    >();
    expectTypeOf<'none'>().toMatchTypeOf<ChatToolChoice>();
    expectTypeOf<'auto'>().toMatchTypeOf<ChatToolChoice>();
    expectTypeOf<{
      type: 'function';
      function: { name: string };
    }>().toMatchTypeOf<ChatToolChoice>();
  });

  it('should expose delta on streaming choices', () => {
    expectTypeOf<Choice['delta']>().toEqualTypeOf<Message | undefined>();
  });
});
