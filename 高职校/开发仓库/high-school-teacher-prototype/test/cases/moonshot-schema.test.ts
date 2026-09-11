import { describe, expect, it, vi } from 'vitest';
import type { LLMModelItemType } from '@fastgpt/global/core/ai/model.d';
import { llmCompletionsBodyFormat } from '../../packages/service/core/ai/llm/request';

vi.mock('../../packages/service/core/ai/model', () => ({
  getLLMModel: () =>
    ({
      model: 'kimi-k3',
      maxContext: 128000,
      maxResponse: 8000,
      toolChoice: true
    }) as LLMModelItemType
}));

describe('llmCompletionsBodyFormat', () => {
  it('inlines Moonshot tool schema references', async () => {
    const { requestBody } = await llmCompletionsBodyFormat({
      model: 'kimi-k3',
      messages: [],
      toolCallMode: 'toolChoice',
      tools: [
        {
          type: 'function',
          function: {
            name: 'create_steps',
            description: 'Create steps',
            parameters: {
              $defs: {
                __schema20: {
                  type: 'array',
                  items: {
                    $ref: '#/$defs/Step'
                  }
                },
                Step: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string'
                    }
                  },
                  required: ['title']
                }
              },
              type: 'object',
              properties: {
                steps: {
                  $ref: '#/$defs/__schema20'
                }
              },
              required: ['steps']
            }
          }
        }
      ] as any
    });

    expect(JSON.stringify(requestBody)).not.toContain('$ref');
    expect(JSON.stringify(requestBody)).not.toContain('$defs');
    expect((requestBody as any).tools[0].function.parameters).toEqual({
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string'
              }
            },
            required: ['title']
          }
        }
      },
      required: ['steps']
    });
  });
});
