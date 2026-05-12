import { EXTRACT_SYSTEM_PROMPT, EXTRACT_TOOL, type ExtractResult } from './import-prompts'

interface ExtractArgs {
  apiKey: string
  menuText: string
  model?: string
}

interface FinalUsage {
  prompt_tokens: number
  output_tokens: number
  model: string
}

export interface ExtractCallResult {
  result: ExtractResult
  usage: FinalUsage
}

/**
 * Call Anthropic Claude Sonnet with tool-based structured output to extract
 * the drinks list from the menu text. Forces the pouriq_extract_menu tool.
 */
export async function extractMenuWithAnthropic(args: ExtractArgs): Promise<ExtractCallResult> {
  const model = args.model ?? 'claude-sonnet-4-6'

  const body = {
    model,
    max_tokens: 4096,
    system: [
      { type: 'text', text: EXTRACT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'pouriq_extract_menu' },
    messages: [{ role: 'user', content: args.menuText }],
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Anthropic ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; name?: string; input?: unknown }>
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  const toolUse = data.content.find((c) => c.type === 'tool_use' && c.name === 'pouriq_extract_menu')
  if (!toolUse || !toolUse.input) {
    throw new Error('Anthropic did not return the extraction tool output')
  }

  return {
    result: toolUse.input as ExtractResult,
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0,
      model,
    },
  }
}
