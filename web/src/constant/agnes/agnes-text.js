/**
 * Agnes 2.5 Flash 文本，OpenAI 兼容 POST /v1/chat/completions
 * Agnes 通过 chat_template_kwargs.enable_thinking 控制思考过程。
 * @param {{role: string, content: string}[]} messages
 * @param {string} systemPrompt
 * @param {string} model
 * @param {string} apiKey
 * @param {string} reasoningEffort "auto" | "low" | "medium" | "high" | "xhigh"
 * @param {function} request
 * @param {function} onDelta
 * @returns {Promise<string>}
 */
async function generateText({ messages, systemPrompt, model, apiKey, reasoningEffort, request, onDelta }) {
  const list = messages.map(({ role, content }) => ({ role, content }));
  if (systemPrompt && !list.some((item) => item.role === "system")) list.unshift({ role: "system", content: systemPrompt });

  const body = { model, messages: list };
  if (reasoningEffort && reasoningEffort !== "auto") body.chat_template_kwargs = { enable_thinking: true };

  const data = await request({
    method: "post",
    url: "/chat/completions",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    data: body,
  });
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
  if (!text) throw new Error("Agnes 文本接口没有返回内容");
  onDelta(text);
  return text;
}

return await generateText({ messages, systemPrompt, model, apiKey, reasoningEffort, request, onDelta });
