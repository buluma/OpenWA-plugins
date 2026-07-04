import type { IPlugin, PluginContext, HookContext, IncomingMessage } from '../types/openwa';

export interface WelcomeConfig {
  welcomeText: string;
  greetInGroups: boolean;
  resetAfterDays: number;
}

export function parseConfig(raw: Record<string, unknown>): WelcomeConfig {
  const welcomeText = String(raw.welcomeText ?? '').trim();
  if (!welcomeText) throw new Error('welcome-greeter: welcomeText is required');

  const resetDays = Number(raw.resetAfterDays);
  return {
    welcomeText,
    greetInGroups: raw.greetInGroups === true,
    resetAfterDays: Number.isFinite(resetDays) ? Math.max(0, resetDays) : 0,
  };
}

/** Namespaced storage key for the greeted-at timestamp of a chat. */
function greetedKey(sessionId: string, chatId: string): string {
  return `greeted:${sessionId}:${chatId}`;
}

const TEMPLATE_VAR = /\{\{(contactName|chatId)\}\}/g;

function renderTemplate(template: string, contactName: string, chatId: string): string {
  return template.replace(TEMPLATE_VAR, (_, key: string) => {
    if (key === 'contactName') return contactName || 'there';
    if (key === 'chatId') return chatId;
    return _;
  });
}

export default class WelcomeGreeter implements IPlugin {
  private config: WelcomeConfig | null = null;

  async onEnable(ctx: PluginContext): Promise<void> {
    this.config = parseConfig(ctx.config);
    const priority = Number(ctx.config.hookPriority) || 20;
    ctx.registerHook('message:received', async (hook: HookContext) => {
      await this.onMessage(ctx, hook);
      return { continue: true };
    }, priority);
  }

  async onConfigChange(ctx: PluginContext): Promise<void> {
    this.config = parseConfig(ctx.config);
  }

  private async onMessage(ctx: PluginContext, hook: HookContext): Promise<void> {
    const cfg = this.config;
    if (!cfg || hook.source !== 'Engine' || !hook.sessionId) return;

    const m = (hook.data ?? {}) as Partial<IncomingMessage>;
    if (m.fromMe || !m.chatId) return;
    if (m.isGroup && !cfg.greetInGroups) return;

    const sessionId = hook.sessionId;
    const chatId = m.chatId;
    const storageKey = greetedKey(sessionId, chatId);

    const contactName =
      m.isGroup && m.author
        ? m.author.split('@')[0] ?? 'there'
        : m.contact?.pushName ?? m.contact?.name ?? m.senderPhone ?? 'there';

    try {
      const greeted = await ctx.storage.get<number>(storageKey);
      if (greeted !== null) {
        if (cfg.resetAfterDays <= 0) return;
        const resetMs = cfg.resetAfterDays * 24 * 60 * 60 * 1000;
        if (Date.now() - greeted < resetMs) return;
      }

      const text = renderTemplate(cfg.welcomeText, contactName, chatId);
      await ctx.messages.sendText(sessionId, chatId, text);
      await ctx.storage.set(storageKey, Date.now());
    } catch (err) {
      ctx.logger.error('welcome-greeter: reply failed', err);
    }
  }
}
