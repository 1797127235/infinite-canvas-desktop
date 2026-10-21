# Codex2API 官方 API 文档导出

来源： https://www.codex2api.com/docs
页面抓取时间：2026-10-20（官网页面实际渲染内容）
文档页面数：89

> 以下内容逐页提取自官网文档页面正文；按官网文档路由顺序排列。

---

## 从一个端点开始接入

官网页面： https://www.codex2api.com/docs/quickstart

```text
AI GATEWAY
从一个端点开始接入

在同一站点接入对话、图片、视频、语音及原生厂商协议。先选择 Key 对应的平台和模型，再从目录找到匹配的接口。所有示例仅用于展示请求结构。

01
创建 API Key

选择可用分组和扣费方式，保存站内密钥。

02
核对模型与协议

查询可见模型，确认分组已启用目标请求协议。

03
提交并读取结果

文本解析普通响应或 SSE；异步任务保存 ID 后轮询。

1. 配置站点地址与密钥
Bash
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
2. 查询当前 Key 可见的模型
Bash
复制
curl "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
3. 选择协议
对话与生成

Messages、Responses、Chat 与 Gemini 原生协议

模型与用量

可见模型目录与 Key 用量查询

图片与批量任务

生成、编辑、异步图片和批量图片

视频与异步任务

统一视频入口与厂商原生视频协议

语音与实时会话

语音合成、识别和实时交互

搜索与扩展

搜索工具及平台专属扩展能力

视频统一 URL 只统一请求入口，参数仍按账号绑定的上游协议解释；原生视频参数无需改成聊天格式。异步图片和视频请使用对应的任务查询接口，长时间生成不需要保持同一个 HTTP 连接。

模型广场
```

---

## 鉴权与通用约定

官网页面： https://www.codex2api.com/docs/auth

```text
鉴权与通用约定

使用本站创建的 API Key，而不是登录令牌或上游厂商密钥。常规接口使用 Bearer；Anthropic 和 Gemini 原生入口也支持各自的认证头。

OpenAI / Video / 通用
复制
Authorization: Bearer $TOKENROUTER_API_KEY
Anthropic Messages
复制
x-api-key: $TOKENROUTER_API_KEY
anthropic-version: 2023-06-01
Gemini 原生
复制
x-goog-api-key: $TOKENROUTER_API_KEY
接入约定
示例中的 BASE_URL 是网关根地址，路径已包含 /v1 或厂商前缀，不要重复拼接 /v1。模型 ID 请以分组模型广场或当前 Key 的模型目录为准。
普通 Key 按绑定分组调用；复合 Key 的模型名称可能包含分组前缀，请使用模型目录返回的名称。客户端协议是否开放与上游平台是两个不同条件。
JSON 请求使用 Content-Type: application/json；文件上传使用 multipart/form-data 并由客户端自动生成 boundary。WebSocket、SDP、音频和文件响应见对应接口。
密钥仅保存在服务端环境变量中，不要放进公开网页、示例仓库或浏览器 URL。文档页面不会读取你的密钥，也不会自动发送计费请求。
通用网关拒绝 URL 中的非空 key / api_key 参数；仅 /v1beta 和 /antigravity/v1beta 为 Gemini SDK 兼容 ?key=，仍拒绝 ?api_key=。优先使用请求头，避免密钥出现在 URL 日志中。
网关响应遵循对应 AI 协议，不套用管理面板的统一 data envelope。SSE 必须完整解析事件；HTTP 200 并不代表流中没有错误。
排查时保留响应头 X-Request-ID、X-Client-Request-ID 或 X-Sub2API-Request-ID。不要把密钥和完整隐私内容放到公开错误报告。
```

---

## 全部端点一览

官网页面： https://www.codex2api.com/docs/overview

```text
全部端点一览

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。 使用左侧搜索和平台筛选缩小范围；点击接口查看完整调用说明。

请求方法	请求路径	说明
POST	/v1/messages	Anthropic Messages
POST	/v1/messages/count_tokens	Messages 输入 Token 统计
POST	/v1/chat/completions	Chat Completions
POST	/v1/responses	Responses
POST	/v1/responses/compact	Responses 上下文压缩
POST	/v1/responses/input_tokens	Responses 输入 Token 统计
WS	/v1/responses	Responses WebSocket
POST	/v1/embeddings	Embeddings 文本向量
GET	/v1/models	可用模型列表
GET	/v1/models/{model}	查询单个模型
GET	/v1/usage	Key 用量与可用额度
GET	/v1beta/models	Gemini 原生模型目录
GET	/v1beta/models/{model}	Gemini 单模型信息
POST	/v1beta/models/{model}:generateContent	Gemini GenerateContent
POST	/v1beta/models/{model}:streamGenerateContent	Gemini 流式生成
POST	/v1beta/models/{model}:countTokens	Gemini 原生 Token 统计
POST	/antigravity/v1/messages	Antigravity 专用 Messages
GET	/antigravity/v1/models	Antigravity 专用模型目录
GET	/antigravity/v1/models/{model}	Antigravity 单模型查询
POST	/v1/systemone	TypeSafe / Jev System One
POST	/v1/alpha/search	Codex Alpha Search
POST	/v1beta/cachedContents	Gemini 创建显式缓存
GET	/v1beta/cachedContents	Gemini 显式缓存列表
GET	/v1beta/cachedContents/{cacheID}	Gemini 查询显式缓存
PATCH	/v1beta/cachedContents/{cacheID}	Gemini 修改缓存有效期
DELETE	/v1beta/cachedContents/{cacheID}	Gemini 删除显式缓存
POST	/v1beta/models/{model}:generateContent	Gemini 引用显式缓存生成
POST	/v1beta/models/{model}:generateContent	Gemini 原生图片生成与编辑
POST	/v1/images/generations	生成图片
POST	/v1/images/edits	编辑图片
POST	/v1/images/generations/async	异步生成图片
POST	/v1/images/edits/async	异步编辑图片
GET	/v1/images/tasks/{task_id}	查询异步图片任务
POST	/v1/images/batches	创建批量图片任务
GET	/v1/images/batches/models	批量图片模型目录
GET	/v1/images/batches	批量图片任务列表
GET	/v1/images/batches/{id}	查询批量图片任务
GET	/v1/images/batches/{id}/items	批量图片子任务
GET	/v1/images/batches/{id}/items/{custom_id}/content	下载批量任务中的图片
GET	/v1/images/batches/{id}/download	下载批量图片 ZIP
POST	/v1/images/batches/{id}/cancel	取消批量图片任务
DELETE	/v1/images/batches/{id}	删除批量任务记录
DELETE	/v1/images/batches/{id}/outputs	清理批量任务产物
POST	/v1/tts	Grok 文字转语音
POST	/v1/stt	Grok 语音转文字
POST	/v1/custom-voices	创建自定义声音
GET	/v1/custom-voices	列出自定义声音
GET	/v1/custom-voices/{voice_id}	查询自定义声音
PATCH	/v1/custom-voices/{voice_id}	更新自定义声音
DELETE	/v1/custom-voices/{voice_id}	删除自定义声音
GET	/v1/custom-voices/{voice_id}/audio	下载自定义声音音频
WS	/v1/realtime	Grok 实时语音 WebSocket
POST	/v1/web_search	Grok 网页搜索
POST	/v1/x_search	Grok X 搜索
POST	/v1/live	OpenAI Live 创建会话
WS	/v1/live/{call_id}	OpenAI Live 控制通道
POST	/v1/videos	Video · 创建 OpenAI Videos 任务
GET	/v1/videos/{video_id}	Video · 查询 OpenAI Videos 任务
GET	/v1/videos/{video_id}/content	Video · 下载或播放视频
POST	/v1/video/generations	Video · 兼容视频创建
GET	/v1/video/generations/{task_id}	Video · 兼容任务查询
DELETE	/v1/video/generations/{task_id}	Video · 取消任务
POST	/api/v3/contents/generations/tasks	Seedance / 方舟 · 创建原生任务
GET	/api/v3/contents/generations/tasks/{task_id}	Seedance / 方舟 · 查询原生任务
DELETE	/api/v3/contents/generations/tasks/{task_id}	Seedance / 方舟 · 删除原生任务
POST	/text-to-video/{model}	Kling · 模型路径文生视频
POST	/image-to-video/{model}	Kling · 模型路径图生视频
POST	/omni-video/{model}	Kling · 模型路径 Omni 视频
POST	/v1/videos/text2video	Kling · 原生 text2video
POST	/v1/videos/omni-video	Kling · 原生 Omni 视频
GET	/tasks	Kling · 查询单个任务
POST	/api/v1/services/aigc/video-generation/video-synthesis	万相 / Wan · 创建原生任务
GET	/api/v1/tasks/{task_id}	万相 / Wan · 查询原生任务
POST	/v2/video_generation	MiniMax · 创建原生视频任务
GET	/v2/query/video_generation/{task_id}	MiniMax · 查询原生视频任务
POST	/ent/v2/img2video	Vidu · 图生视频
POST	/ent/v2/reference2video	Vidu · 参考生视频
POST	/ent/v2/text2video	Vidu · 文生视频
POST	/ent/v2/start-end2video	Vidu · 首尾帧视频
GET	/ent/v2/tasks/{task_id}/creations	Vidu · 查询视频任务
POST	/v1/videos/generations	Grok · 视频生成
POST	/v1/videos/edits	Grok · 视频编辑
POST	/v1/videos/extensions	Grok · 视频扩展
GET	/v1/videos/generations/{request_id}	Grok · 查询生成、编辑或扩展任务
GET	/v1/videos/generations/{request_id}/content	Grok · 获取生成、编辑或扩展内容
```

---

## 常见错误与排查

官网页面： https://www.codex2api.com/docs/errors

```text
常见错误与排查

不同协议、上游以及站点错误策略的状态码和错误字段可能不同，请同时检查 HTTP 状态、响应正文和流式终止事件。以下是排查方向，不是强制统一的错误格式。

400 · invalid_request_error / invalid_request

检查 JSON、必填字段、模型 ID、参数类型与当前协议；厂商原生请求需要对应的原生结构。

401 · authentication_error

检查站内 API Key 是否有效，是否正确携带认证头；站内 Key 与上游密钥不能互换。

402 / 403 · 余额、配额或权限不足

检查余额、订阅、Key 配额、分组平台、模型权限和已开启的客户端协议；具体状态码依接口而定。

404 · not_found

核对路由、模型或任务 ID；任务接口还会检查原用户与原 Key 的归属。

409 · conflict

幂等键对应的请求不一致、任务状态冲突或内容尚未满足读取条件；按返回的错误信息处理。

413 · request_too_large

请求体或上传素材超过服务限制，缩小输入后重试。

429 · rate_limit_error

并发、速率或平台限额达到上限，降低并发并按响应提示退避。

500 / 502 / 503 / 504 · server_error / upstream_error

服务或上游暂时不可用。异步创建结果不明确时先查已有任务，避免直接重复提交产生多次任务。

SSE · error / response.failed

流式连接建立后仍可能收到错误事件；不要仅凭 HTTP 200 判定成功，应读到协议终止事件。

异步任务没有立即返回结果

提交成功后保存任务 ID，使用原 Key 轮询对应平台的查询接口。queued / processing / in_progress 等中间态不代表失败。创建返回错误且没有任务 ID 的独立 Video 任务会按当前规则释放预留；网络中断等无法确认的情况可能进入待核对，不能根据一次超时直接判断退款结果。失败或取消后的额度以任务记录中的结算状态为准。
```

---

## Anthropic Messages

官网页面： https://www.codex2api.com/docs/messages

```text
对话与生成
Anthropic
OpenAI
Gemini
Antigravity
Grok
Qoder
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Anthropic Messages
复制 MD

使用 Anthropic 消息格式进行文本、多模态或工具调用。按 Key 所选分组原生转发或转换为对应平台协议。

POST
/v1/messages

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-api-key: $TOKENROUTER_API_KEY
anthropic-version: 2023-06-01
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
messages	array	是	Body · 对话历史，元素包含 role（user / assistant）和 content（字符串或内容块数组）；工具结果使用 tool_result 内容块。
max_tokens	integer	是	Body · 最大输出 Token 数；实际范围由模型与上游决定。
system	string | array	否	Body · 系统指令；内容块可携带供应商支持的缓存标记。
stream	boolean	否	Body · true 返回 Anthropic SSE；false 返回完整 JSON。
tools / tool_choice	array / object	否	Body · 工具声明使用 name、description、input_schema；工具是否可用由目标模型决定。客户端执行工具后继续提交 tool_result。
temperature / top_p / stop_sequences / thinking	number / array / object	否	Body · 采样、停止词及思考参数按所选模型支持范围填写，跨协议转换不能保证所有厂商扩展都等价。
anthropic-version / anthropic-beta	string	否	Header · 原生 Anthropic 版本和可选能力声明，例如 anthropic-version: 2023-06-01；并非所有上游都支持相同 beta。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/messages" \
  -H "x-api-key: $TOKENROUTER_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "claude-sonnet-4",
  "max_tokens": 512,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "stream": false
}'
JSON
复制
{
  "model": "claude-sonnet-4",
  "max_tokens": 512,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "stream": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例为非流式成功响应。流式模式依次接收 message_start、content_block_*、message_delta、message_stop；发生错误时应处理 error 事件。

JSON
复制
{
  "id": "msg_example",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4",
  "content": [
    {
      "type": "text",
      "text": "我是帮助你解决问题的 AI 助手。"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 18,
    "output_tokens": 16
  }
}
使用说明
分组必须允许 Anthropic Messages 入站协议；Video 分组不提供文本生成。
模型 ID、图片、thinking、缓存和工具能力以当前分组及上游为准。函数工具调用只返回调用信息，不会自动连接客户端文件系统。
Qoder、Gemini、Grok、国产供应商和 OpenCode 使用各自转换链路；OpenCode Jev 必须走 System One 专用接口。
常见错误与排查
400 · invalid_request_error

模型或消息格式错误，参数与所选模型不兼容。

403 · permission_error

分组未允许 Messages 协议或其他分组策略拒绝。

503 · api_error

当前模型没有可调度账号；检查分组、账号状态和并发。

常见错误与排查
```

---

## Chat Completions

官网页面： https://www.codex2api.com/docs/chat-completions

```text
对话与生成
Anthropic
OpenAI
Gemini
Antigravity
Grok
Qoder
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Chat Completions
复制 MD

OpenAI Chat 兼容的对话接口，适合使用 messages 的 SDK 与应用。

POST
/v1/chat/completions

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
messages	array	是	Body · 角色和内容数组，role 通常为 system、developer、user、assistant、tool。工具结果需关联 tool_call_id；具体角色支持随模型变化。
stream / stream_options	boolean / object	否	Body · stream=true 返回 SSE；stream_options.include_usage 可请求终态 usage，实际输出受上游支持限制。
max_tokens / max_completion_tokens	integer	否	Body · 输出预算，按模型选用相应字段。
temperature / top_p / stop	number / string | array	否	Body · 采样与停止参数；推理模型可能限制这些参数。
tools / tool_choice	array / string | object	否	Body · 函数工具采用 {type:"function",function:{name,description,parameters}}；收到 tool_calls 后由客户端执行并回传结果。
response_format / reasoning_effort	object / string	否	Body · 结构化输出及思考档位，仅适用于支持的模型。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-6-astra",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "stream": false
}'
JSON
复制
{
  "model": "gpt-6-astra",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "stream": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

stream=true 时返回 chat.completion.chunk 数据帧，并通常以 data: [DONE] 结束；工具调用增量在 choices[].delta.tool_calls。

JSON
复制
{
  "id": "chatcmpl_example",
  "object": "chat.completion",
  "created": 1760000000,
  "model": "gpt-6-astra",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好！"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 4,
    "total_tokens": 16
  }
}
使用说明
分组必须允许 Chat Completions；无需根据上游平台改写本站路径。
请求的多模态和工具字段仍受目标模型能力限制；Jev 不支持此入口。
兼容路径
/chat/completions
常见错误与排查
403 · protocol_not_allowed

该分组未开启 Chat Completions 入站协议。

400 · invalid_request_error

messages、模型或工具调用历史格式错误。

常见错误与排查
```

---

## Responses

官网页面： https://www.codex2api.com/docs/responses

```text
对话与生成
Anthropic
OpenAI
Gemini
Antigravity
Grok
Qoder
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Responses
复制 MD

OpenAI Responses 兼容生成接口，可用于文本、多模态、工具调用及支持的 Codex 客户端。

POST
/v1/responses

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
input	string | array	是	Body · 用户输入或完整历史项数组。消息内容支持 input_text；图片、工具调用及工具结果的支持范围取决于上游。
instructions	string	否	Body · 本轮系统指令。继续对话时请按客户端协议重新提供需要保留的指令。
stream	boolean	否	Body · true 返回 Responses SSE 事件；false 返回完整 response 对象。
tools / tool_choice / parallel_tool_calls	array / string | object / boolean	否	Body · 函数工具示例：{type:"function", name:"lookup", parameters:{type:"object",properties:{}}}。函数执行在客户端，托管工具还需模型和账号支持。
max_output_tokens / reasoning / text	integer / object / object	否	Body · 输出预算、思考档位及输出格式；字段和取值需符合目标模型能力。
previous_response_id / store	string / boolean	否	Body · 上游状态续接选项。部分兼容平台使用无状态转换，不支持依赖此字段省略历史；跨平台客户端应保留完整历史。
metadata / prompt_cache_key	object / string	否	Body · 应用元数据与稳定缓存会话标识；不代表网关永久保存对话。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/responses" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-6-astra",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "你好，请简短回答。"
        }
      ]
    }
  ],
  "stream": false
}'
JSON
复制
{
  "model": "gpt-6-astra",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "你好，请简短回答。"
        }
      ]
    }
  ],
  "stream": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

流式模式返回 response.created、response.output_text.delta、工具调用事件及 response.completed / response.failed 等终态。HTTP 200 或某一个进度事件不代表生成成功。

JSON
复制
{
  "id": "resp_example",
  "object": "response",
  "status": "completed",
  "model": "gpt-6-astra",
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "你好！"
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 12,
    "output_tokens": 4,
    "total_tokens": 16
  }
}
使用说明
分组必须允许 Responses 协议。账号配置可能使请求走原生 Responses 或转换后的 Chat / Messages。
客户端应完整消费终态和 usage；在流已经产生输出后，不应将断流简单当成未调用成功而自动重放。
这是 POST 生成接口；网关没有注册通用 GET /v1/responses/{id} 的历史响应检索接口。
兼容路径
/responses
/backend-api/codex/responses
常见错误与排查
403 · protocol_not_allowed

分组未开启 Responses 入站协议。

400 · invalid_request_error

model、input 或工具历史结构不符合目标协议。

503 · api_error

模型无可用账号、容量不足或可重试上游故障未能恢复。

常见错误与排查
```

---

## Responses 上下文压缩

官网页面： https://www.codex2api.com/docs/responses-compact

```text
对话与生成
OpenAI
Responses 上下文压缩
复制 MD

供支持远程压缩的 OpenAI / Codex 客户端缩减长会话上下文。

POST
/v1/responses/compact

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
input	array	是	Body · 待压缩的完整历史输入项，包含消息与已完成的工具调用/结果。
instructions	string	否	Body · 压缩时保留的系统指令，按客户端和上游协议提供。
reasoning / service_tier	object / string	否	Body · 上游支持的思考与服务档位配置。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/responses/compact" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-6-astra",
  "input": [
    {
      "role": "user",
      "content": "需要保留的较长会话内容。"
    }
  ]
}'
JSON
复制
{
  "model": "gpt-6-astra",
  "input": [
    {
      "role": "user",
      "content": "需要保留的较长会话内容。"
    }
  ]
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例仅展示压缩结果的关键字段；原生响应由上游决定。encrypted_content 是不透明内容，应按客户端协议原样用于后续对话。

JSON
复制
{
  "id": "resp_compact_example",
  "output": [
    {
      "type": "compaction",
      "encrypted_content": "<上游返回的不透明压缩内容>"
    }
  ],
  "usage": {
    "input_tokens": 1000,
    "output_tokens": 100
  }
}
使用说明
需要账号具备 Compact 能力；普通文本可用不代表压缩端点可用。
新式 Codex remote compaction v2 可能在普通流式 /responses 中发送 compaction_trigger，它与此旧版独立压缩入口并存。
Responses 安全子路径可进入通配路由，但不意味着所有上游都实现任意子资源。Qoder 明确拒绝 Responses 子路径。
兼容路径
/responses/compact
/backend-api/codex/responses/compact
常见错误与排查
503 · compact_not_supported

没有可承接压缩请求的账号。

404 · not_found_error

路径不安全、所选平台不支持子路径，或上游未实现压缩。

常见错误与排查
```

---

## Responses WebSocket

官网页面： https://www.codex2api.com/docs/responses-websocket

```text
对话与生成
OpenAI
Grok
Responses WebSocket
复制 MD

建立持久 WebSocket 连接，以 response.create 消息发起模型调用。

WS
/v1/responses

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
Authorization	string	是	握手 Header · Bearer 站内 API Key；使用可发送认证头的服务端 WebSocket 客户端，不要把 Key 放入 URL。
type	string	是	JSON 消息 · 首条生成消息使用 response.create。
model	string	是	JSON 消息 · 模型 ID，必须可用于当前账号的 Responses WS 通道。
input / tools / previous_response_id	string | array / array / string	否	JSON 消息 · 其余内容按 Responses WS 协议提供。续接状态和可用字段受上游与传输模式限制。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
WebSocket
复制
wss://YOUR_GATEWAY_HOST/v1/responses
Authorization: Bearer $TOKENROUTER_API_KEY

{
  "type": "response.create",
  "model": "gpt-6-astra",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "你好"
        }
      ]
    }
  ]
}
响应示例 HTTP 101

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

HTTP 握手成功返回 101，后续示例为单条 WS JSON 帧。必须继续读取 response.completed / response.failed 等终态，不能把 delta 当成完整回复。

JSON
复制
{
  "type": "response.output_text.delta",
  "response_id": "resp_example",
  "output_index": 0,
  "content_index": 0,
  "delta": "你好"
}
使用说明
GET 同路径用于 Upgrade，普通 HTTP GET 不会生成文本。WebSocket 的账号和分组能力检查独立于普通 HTTP Responses。
只有 OpenAI / Grok 平台进入 WS 处理器；具体账号传输配置仍可能拒绝连接。
兼容路径
/responses
/backend-api/codex/responses
常见错误与排查
404 · not_found_error

当前平台未提供 Responses WebSocket。

426 · invalid_request_error

没有发送有效的 WebSocket Upgrade 请求。升级后的无效首帧会通过 WS 关闭码或错误帧报告。

503 · api_error

WS 账号或连接容量不可用。

常见错误与排查
```

---

## Embeddings 文本向量

官网页面： https://www.codex2api.com/docs/embeddings

```text
对话与生成
OpenAI
Embeddings 文本向量
复制 MD

将文本转为向量，适用于检索、聚类或语义匹配；仅 OpenAI 分组可用。

POST
/v1/embeddings

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
input	string | array	是	Body · 待编码文本或文本数组；token ID 输入是否可用由所选上游模型决定。
encoding_format	string	否	Body · float 或 base64，以模型支持范围为准。
dimensions	integer	否	Body · 支持缩减维度的模型可指定输出维数。
user	string	否	Body · 可选的应用用户标识，不要填入敏感凭据。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/embeddings" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "text-embedding-3-small",
  "input": "一只猫坐在窗边。",
  "encoding_format": "float"
}'
JSON
复制
{
  "model": "text-embedding-3-small",
  "input": "一只猫坐在窗边。",
  "encoding_format": "float"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

向量示例仅保留三个元素便于阅读，真实长度取决于模型与 dimensions。

JSON
复制
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        0.012,
        -0.018,
        0.025
      ]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
使用说明
还需账号具有 Embeddings 端点能力与有效的模型定价；普通 OAuth 文本账号不代表自动支持向量。
兼容路径
/embeddings
常见错误与排查
404 · not_found_error

分组不是 OpenAI 或上游不支持 Embeddings。

400 · invalid_request_error

输入、维数或编码格式不支持。

常见错误与排查
```

---

## Gemini GenerateContent

官网页面： https://www.codex2api.com/docs/gemini-generate-content

```text
对话与生成
Gemini
Antigravity
Gemini GenerateContent
复制 MD

使用 Gemini 原生 contents / parts 请求体生成内容，保持 Google 响应结构。

POST
/v1beta/models/{model}:generateContent

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Path · 模型名称，不在 Body 中重复 model；使用目录中 models/ 后的名称。
contents	array	是	Body · 每项包含 role（user / model）及 parts。文本 part 使用 {text:"你好"}，多模态结构遵循 Gemini 原生协议。
systemInstruction	object	否	Body · 系统指令，例如 {parts:[{text:"简洁回答"}]}。
generationConfig	object	否	Body · temperature、maxOutputTokens、responseMimeType、thinkingConfig 等模型支持的生成配置。图片输出仅在对应图片模型及账号能力可用时支持。
cachedContent	string	否	Body · 本站 /v1beta/cachedContents 创建响应中的 name。仅固定 Gemini 分组 Key 可用，必须使用原 Key、原分组和同一模型；复合 Key、智能路由与 Antigravity 不支持。详见 Gemini 显式缓存指南。
tools / toolConfig / safetySettings	array / object / array	否	Body · Gemini 原生工具、工具选择和安全配置。Antigravity 兼容转换有独立能力限制，不能假定所有内置工具均可组合。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1beta/models/{model}:generateContent" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 512
  }
}'
JSON
复制
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 512
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "我是一个 AI 助手。"
          }
        ]
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 12,
    "candidatesTokenCount": 8,
    "totalTokenCount": 20
  }
}
使用说明
普通入口要求 Gemini 分组；Antigravity 使用专用前缀。生成还需分组开启 Gemini GenerateContent 协议。
本端点也承载兼容的 Gemini 图片生成模型：通过 generationConfig.responseModalities 等原生参数请求，输出可能包含 inlineData。不要将它与 OpenAI Images 请求体混用。
正常完成原因、内容安全阻断和 HTTP 错误含义不同；请同时检查 candidates、finishReason 与 promptFeedback。
兼容路径
/v1beta/models/{model}/generateContent
/antigravity/v1beta/models/{model}:generateContent
/antigravity/v1beta/models/{model}/generateContent
常见错误与排查
403 · PERMISSION_DENIED

分组未允许 Gemini 生成协议或权限不足。

400 · INVALID_ARGUMENT

模型路径、parts 或 generationConfig 不符合上游要求。

常见错误与排查
```

---

## Gemini 流式生成

官网页面： https://www.codex2api.com/docs/gemini-stream-content

```text
对话与生成
Gemini
Antigravity
Gemini 流式生成
复制 MD

通过 streamGenerateContent 动作逐步返回 Gemini 原生内容片段。

POST
/v1beta/models/{model}:streamGenerateContent

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Path · 模型名称，不在 Body 中重复 model；使用目录中 models/ 后的名称。
contents	array	是	Body · 每项包含 role（user / model）及 parts。文本 part 使用 {text:"你好"}，多模态结构遵循 Gemini 原生协议。
systemInstruction	object	否	Body · 系统指令，例如 {parts:[{text:"简洁回答"}]}。
generationConfig	object	否	Body · temperature、maxOutputTokens、responseMimeType、thinkingConfig 等模型支持的生成配置。图片输出仅在对应图片模型及账号能力可用时支持。
cachedContent	string	否	Body · 本站 /v1beta/cachedContents 创建响应中的 name。仅固定 Gemini 分组 Key 可用，必须使用原 Key、原分组和同一模型；复合 Key、智能路由与 Antigravity 不支持。详见 Gemini 显式缓存指南。
tools / toolConfig / safetySettings	array / object / array	否	Body · Gemini 原生工具、工具选择和安全配置。Antigravity 兼容转换有独立能力限制，不能假定所有内置工具均可组合。
alt	string	否	Query · Gemini SDK 常使用 alt=sse 请求 SSE 传输；以客户端及上游兼容方式为准。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1beta/models/{model}:streamGenerateContent" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 512
  }
}'
JSON
复制
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 512
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例为 SSE。各片段保持 Gemini 形状，不是 OpenAI choices 或 Responses 事件；正确读取结束状态与末尾 usageMetadata。

text
复制
data: {"candidates":[{"content":{"role":"model","parts":[{"text":"你好"}]},"index":0}]}

data: {"candidates":[{"finishReason":"STOP","index":0}],"usageMetadata":{"promptTokenCount":12,"candidatesTokenCount":2,"totalTokenCount":14}}


使用说明
不要在请求体中仅设置 stream=true 来替代动作名称。Antigravity 使用专用路径，账号与分组能力要求同非流式接口。
兼容路径
/v1beta/models/{model}/streamGenerateContent
/antigravity/v1beta/models/{model}:streamGenerateContent
/antigravity/v1beta/models/{model}/streamGenerateContent
常见错误与排查
429 · RESOURCE_EXHAUSTED

并发或额度不足；若流已开启，错误可能出现在流内。

503 · UNAVAILABLE

当前没有可用生成账号。

常见错误与排查
```

---

## Antigravity 专用 Messages

官网页面： https://www.codex2api.com/docs/antigravity-messages

```text
对话与生成
Antigravity
Antigravity 专用 Messages
复制 MD

使用 Anthropic 协议并强制选择 Antigravity 账号，适用于需要固定 Antigravity 链路的客户端。

POST
/antigravity/v1/messages

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-api-key: $TOKENROUTER_API_KEY
anthropic-version: 2023-06-01
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
messages	array	是	Body · 对话历史，元素包含 role（user / assistant）和 content（字符串或内容块数组）；工具结果使用 tool_result 内容块。
max_tokens	integer	是	Body · 最大输出 Token 数；实际范围由模型与上游决定。
system	string | array	否	Body · 系统指令；内容块可携带供应商支持的缓存标记。
stream	boolean	否	Body · true 返回 Anthropic SSE；false 返回完整 JSON。
tools / tool_choice	array / object	否	Body · 工具声明使用 name、description、input_schema；工具是否可用由目标模型决定。客户端执行工具后继续提交 tool_result。
temperature / top_p / stop_sequences / thinking	number / array / object	否	Body · 采样、停止词及思考参数按所选模型支持范围填写，跨协议转换不能保证所有厂商扩展都等价。
anthropic-version / anthropic-beta	string	否	Header · 原生 Anthropic 版本和可选能力声明，例如 anthropic-version: 2023-06-01；并非所有上游都支持相同 beta。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/antigravity/v1/messages" \
  -H "x-api-key: $TOKENROUTER_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "claude-sonnet-4",
  "max_tokens": 512,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "stream": false
}'
JSON
复制
{
  "model": "claude-sonnet-4",
  "max_tokens": 512,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "用一句话介绍你自己。"
        }
      ]
    }
  ],
  "stream": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "msg_example",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4",
  "content": [
    {
      "type": "text",
      "text": "我是帮助你解决问题的 AI 助手。"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 18,
    "output_tokens": 16
  }
}
使用说明
认证仍使用站内 Key，不使用 Google / Antigravity OAuth 凭据。强制平台不绕过分组协议、模型和额度权限。
仅选择 Antigravity 账号，不参与普通 Anthropic / Gemini 混合调度。
/antigravity/v1/messages/count_tokens 当前明确返回 404；客户端请保留本地估算。
常见错误与排查
403 · permission_error

分组未允许 Messages 或模型访问被拒绝。

503 · api_error

没有满足资格的 Antigravity 账号。

常见错误与排查
```

---

## Gemini 引用显式缓存生成

官网页面： https://www.codex2api.com/docs/gemini-cache-generate

```text
对话与生成
Gemini
Gemini 引用显式缓存生成
复制 MD

使用创建缓存时返回的 name，与本轮问题一起发起 Gemini 原生生成。

POST
/v1beta/models/{model}:generateContent

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Path · 与创建缓存时相同的模型；使用模型 ID，不带 models/ 前缀。
cachedContent	string	是	Body · 本站创建缓存响应中的完整 name，例如 cachedContents/abc123。
contents	array	是	Body · 本轮新增的问题，使用 Gemini role / parts 结构，不必重复发送已缓存的长文档。
generationConfig	object	否	Body · 模型支持的生成配置，例如 maxOutputTokens。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "cachedContent": "cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl",
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "根据缓存的产品手册，总结安装步骤。"
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 512
  }
}'
JSON
复制
{
  "cachedContent": "cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl",
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "根据缓存的产品手册，总结安装步骤。"
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 512
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "安装步骤如下……"
          }
        ]
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 32788,
    "cachedContentTokenCount": 32768,
    "candidatesTokenCount": 100,
    "totalTokenCount": 32888
  }
}
使用说明
仅支持绑定固定 Gemini 分组的站内 API Key；不支持复合 Key、智能路由 Key、Antigravity 专用入口或其他平台分组。团队 Key 仍须通过团队身份、成员资格和分组权限检查，产生费用的操作还受团队及成员额度限制。
缓存按创建时的 API Key 和分组隔离，即使同一用户也不能换另一把 Key 使用。查询、续期、删除和生成引用必须使用原 Key、原分组与本站返回的 name；不要填写上游账号的缓存 ID。
同样可在 /v1beta/models/{model}:streamGenerateContent 的请求体中提供 cachedContent；流式响应格式与普通 Gemini 原生生成一致。
引用缓存会固定使用持有该缓存的账号，不会换到另一个上游账号；模型必须与缓存模型一致，缓存不可用时应重新创建。
生成调用仍按实际返回的输入、缓存读取及输出用量和本站价格计费，不因缓存已付存储费而免费；创建与续期的输入/存储费属于独立费用。
常见错误与排查
400 · INVALID_ARGUMENT

Key 类型、分组、请求格式、TTL 或模型不支持；创建要求有可用的输入及缓存存储报价，延长要求有缓存存储报价。

403 · PERMISSION_DENIED

缓存不存在、已过期或不属于当前 Key / 分组时统一返回 CachedContent not found (or permission denied)；创建、续期或生成也可能因协议或额度权限被拒绝。

503 · UNAVAILABLE

没有支持显式缓存的可用账号，或持有缓存的账号暂不可用；不会将同一缓存切换到另一账号。

常见错误与排查
```

---

## 可用模型列表

官网页面： https://www.codex2api.com/docs/models-list

```text
模型与用量
Anthropic
OpenAI
Gemini
Antigravity
Grok
Qoder
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Video
可用模型列表
复制 MD

返回当前 Key 可访问的模型目录，用于 SDK 模型选择。目录受分组、渠道、账号映射和可见规则共同约束。

GET
/v1/models

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

此接口没有额外请求体；路径及查询参数以接口说明为准。

请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

data 为模型数组，始终以 id 发起调用；display_name、created、owned_by、能力等附加字段可能因平台而不同。

JSON
复制
{
  "object": "list",
  "data": [
    {
      "id": "gpt-6-astra",
      "object": "model",
      "type": "model",
      "created": 1704067200,
      "owned_by": "openai",
      "display_name": "GPT-6 Astra"
    }
  ]
}
使用说明
复合 Key / 智能路由 Key 聚合其有权访问的候选分组；API Key 精确模型别名也可能出现在目录中。
空列表表示当前权限和配置下没有可展示模型，不代表上游服务宕机。
Codex 客户端可使用无前缀 /models；旧 /backend-api/codex/models 已移除，不要使用该路径。模型目录不是上游全量模型列表的无条件代理。
兼容路径
/models
常见错误与排查
400 · invalid_request_error / invalid_request

检查 JSON、必填字段、模型 ID、参数类型与当前协议；厂商原生请求需要对应的原生结构。

401 · authentication_error

检查站内 API Key 是否有效，是否正确携带认证头；站内 Key 与上游密钥不能互换。

402 / 403 · 余额、配额或权限不足

检查余额、订阅、Key 配额、分组平台、模型权限和已开启的客户端协议；具体状态码依接口而定。

404 · not_found

核对路由、模型或任务 ID；任务接口还会检查原用户与原 Key 的归属。

常见错误与排查
```

---

## 查询单个模型

官网页面： https://www.codex2api.com/docs/models-retrieve

```text
模型与用量
Anthropic
OpenAI
Gemini
Antigravity
Grok
Qoder
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Video
查询单个模型
复制 MD

从与模型列表相同的可见目录中精确查询模型，不泄露其他分组的型号。

GET
/v1/models/{model}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
model	string	是	Path · 从列表取得的完整 id，包含供应商前缀或复合 Key 前缀时应完整保留。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/models/{model}" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "gpt-6-astra",
  "object": "model",
  "display_name": "GPT-6 Astra",
  "owned_by": "openai"
}
兼容路径
/models/{model}
常见错误与排查
404 · model_not_found

模型不存在或当前 Key 不可见；两者统一返回 404。

常见错误与排查
```

---

## Key 用量与可用额度

官网页面： https://www.codex2api.com/docs/key-usage

```text
模型与用量
Anthropic
OpenAI
Gemini
Antigravity
Grok
Qoder
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Video
Key 用量与可用额度
复制 MD

查询站内 Key 的用量、余额或订阅资金来源，适合 CC Switch 等客户端展示。

GET
/v1/usage

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
days	integer	否	Query · 日用量统计范围，允许 1–90。
start_date / end_date	string	否	Query · 模型统计的日期范围；未提供时使用近 30 天。仅日期的 end_date 包含该日。
timezone	string	否	Query · 日期解析时区，例如 Asia/Shanghai。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/usage" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例为钱包模式。有限额 Key 返回 quota_limited 与 quota / rate_limits；订阅模式返回 subscription。usage、daily_usage、model_stats 为按当前 Key 查询的可选统计。

JSON
复制
{
  "mode": "unrestricted",
  "isValid": true,
  "planName": "钱包余额",
  "remaining": 20,
  "unit": "USD",
  "balance": 20,
  "billing": {
    "mode": "balance",
    "source": "balance",
    "preferred_subscription_id": null,
    "available": true,
    "unit": "USD"
  }
}
使用说明
这是本站账本和权益视图，不是上游余额查询；unit 以站点配置为准。
指定订阅的 Key 不会因套餐失效而在此接口隐式回退钱包；应检查 billing.available 与 billing.source。
Antigravity 别名仍只查询当前 Key 的本地额度，不授予额外权限。
兼容路径
/antigravity/v1/usage
常见错误与排查
400 · invalid_request_error

days 不在 1–90 范围内。

500 · api_error

无法读取资金来源。

常见错误与排查
```

---

## Gemini 原生模型目录

官网页面： https://www.codex2api.com/docs/gemini-models-list

```text
模型与用量
Gemini
Antigravity
Gemini 原生模型目录
复制 MD

为 Gemini SDK 返回 models 数组和 supportedGenerationMethods 等原生元数据。

GET
/v1beta/models

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

此接口没有额外请求体；路径及查询参数以接口说明为准。

请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1beta/models" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "models": [
    {
      "name": "models/gemini-2.5-pro",
      "displayName": "Gemini 2.5 Pro",
      "supportedGenerationMethods": [
        "generateContent",
        "streamGenerateContent"
      ]
    }
  ]
}
使用说明
普通 /v1beta 入口要求 Gemini 分组；Antigravity 使用 /antigravity/v1beta 前缀。
依据 Key 类型、分组自定义目录、账号 AI Studio 查询或兼容回退目录返回模型；不能仅由模型出现在回退目录推定其当前一定可调度。
生成协议开关不阻止此 GET 目录查询。
兼容路径
/antigravity/v1beta/models
常见错误与排查
400 · INVALID_ARGUMENT

当前 Key 分组不是 Gemini，且没有使用 Antigravity 专用入口。

503 · UNAVAILABLE

没有可查询目录的可用账号。

常见错误与排查
```

---

## Gemini 单模型信息

官网页面： https://www.codex2api.com/docs/gemini-models-retrieve

```text
模型与用量
Gemini
Antigravity
Gemini 单模型信息
复制 MD

查询指定模型的 Gemini 格式元数据。

GET
/v1beta/models/{model}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
model	string	是	Path · Gemini 模型名称，例如 gemini-2.5-pro。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1beta/models/{model}" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "name": "models/gemini-2.5-pro",
  "displayName": "Gemini 2.5 Pro",
  "supportedGenerationMethods": [
    "generateContent",
    "streamGenerateContent"
  ]
}
使用说明
原生元数据可能来自上游或兼容回退；模型是否可生成还须通过分组、模型和账号资格检查。Antigravity 使用其专用前缀。
兼容路径
/antigravity/v1beta/models/{model}
常见错误与排查
400 · INVALID_ARGUMENT

分组平台或模型路径不合法。

404 · NOT_FOUND

模型不可用或上游没有该模型。

常见错误与排查
```

---

## Antigravity 专用模型目录

官网页面： https://www.codex2api.com/docs/antigravity-models

```text
模型与用量
Antigravity
Antigravity 专用模型目录
复制 MD

返回当前 Key / 分组可请求的 Antigravity 模型。

GET
/antigravity/v1/models

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

此接口没有额外请求体；路径及查询参数以接口说明为准。

请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/antigravity/v1/models" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "object": "list",
  "data": [
    {
      "id": "claude-sonnet-4",
      "type": "model",
      "display_name": "Claude Sonnet 4"
    }
  ]
}
使用说明
这是 Anthropic / OpenAI 兼容的 data 数组；Gemini SDK 请使用 /antigravity/v1beta/models。
实际可见型号来自当前分组、映射和账号能力，示例型号仅用于说明结构。
兼容路径
/antigravity/models
常见错误与排查
400 · invalid_request_error / invalid_request

检查 JSON、必填字段、模型 ID、参数类型与当前协议；厂商原生请求需要对应的原生结构。

401 · authentication_error

检查站内 API Key 是否有效，是否正确携带认证头；站内 Key 与上游密钥不能互换。

402 / 403 · 余额、配额或权限不足

检查余额、订阅、Key 配额、分组平台、模型权限和已开启的客户端协议；具体状态码依接口而定。

404 · not_found

核对路由、模型或任务 ID；任务接口还会检查原用户与原 Key 的归属。

常见错误与排查
```

---

## Antigravity 单模型查询

官网页面： https://www.codex2api.com/docs/antigravity-model-retrieve

```text
模型与用量
Antigravity
Antigravity 单模型查询
复制 MD

在 Antigravity 专用可见模型目录中查询一个模型。

GET
/antigravity/v1/models/{model}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
model	string	是	Path · 专用目录返回的完整模型 ID。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/antigravity/v1/models/{model}" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "claude-sonnet-4",
  "type": "model",
  "display_name": "Claude Sonnet 4"
}
兼容路径
/antigravity/models/{model}
常见错误与排查
404 · model_not_found

模型不存在或当前 Key 不可见。

常见错误与排查
```

---

## Gemini 原生图片生成与编辑

官网页面： https://www.codex2api.com/docs/gemini-images

```text
图片与批量任务
Gemini
Gemini 原生图片生成与编辑
复制 MD

通过 GenerateContent 的图片模态生成图片，或携带 inlineData 参考图进行编辑。

POST
/v1beta/models/{model}:generateContent

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Path：模型目录中支持图片输出的 Gemini 模型 ID；仅能识图的文本模型不一定支持生图。
contents	array<object>	是	Body：Gemini 原生消息列表，通常使用 role=user 与 parts。
contents[].parts[].text	string	是	Body：图片生成或编辑提示词。
contents[].parts[].inlineData	object	否	Body：参考图片，包含 mimeType（如 image/png）与 data（纯 Base64 字符串，不加 data: 前缀）；每张参考图作为单独 part。
generationConfig.responseModalities	array<string>	是	Body：图片请求使用 ["TEXT", "IMAGE"]，请求文本与图片输出。
generationConfig.imageConfig.aspectRatio	string	否	Body：图片宽高比，例如 1:1；支持范围由所选模型决定。
generationConfig.imageConfig.imageSize	string	否	Body：输出分辨率档位，例如 1K、2K、4K；仅在所选模型支持时设置，必须位于 imageConfig 内，不能直接写在 generationConfig 下。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "生成一幅水彩山景，画面中央是一间木屋"
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": [
      "TEXT",
      "IMAGE"
    ],
    "imageConfig": {
      "aspectRatio": "1:1"
    }
  }
}'
JSON
复制
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "生成一幅水彩山景，画面中央是一间木屋"
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": [
      "TEXT",
      "IMAGE"
    ],
    "imageConfig": {
      "aspectRatio": "1:1"
    }
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

图片位于 candidates[].content.parts[].inlineData；将 data 按 Base64 解码，使用 mimeType 保存图片。文本、图片数量与 usageMetadata 以实际响应为准。

JSON
复制
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "已生成图片。"
          },
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": "<图片文件的 Base64 数据>"
            }
          }
        ]
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 20,
    "candidatesTokenCount": 1000,
    "totalTokenCount": 1020
  }
}
使用说明
这与 Gemini 文本接口使用同一路径，区别在于模型和 responseModalities。不是 /v1/images/generations，也不会返回 OpenAI 的 data[].url。
编辑图片时在 contents[].parts 中追加 {"inlineData":{"mimeType":"image/png","data":"<参考图片的纯 Base64>"}}；用实际图片内容替换占位符。示例响应中的 Base64 占位符不能直接解码为图片。
需要分组启用 Gemini GenerateContent 并有可用图片账号/模型。API Key、OAuth 和 Vertex 的真实图片能力可能不同。
无需图片尺寸档位时省略 imageSize。可用档位依模型而异，不能把批量图片接口仅支持 1K 的限制套用到此原生接口。
原生响应按实际图片 part 记录图片用量；HTTP 200 仍可能没有图片，请检查 candidates、promptFeedback 与 finishReason。
常见错误与排查
400 · INVALID_ARGUMENT

图片、contents 或生成配置不合法，或模型拒绝当前输入。

403 · PERMISSION_DENIED

分组未允许 GenerateContent 或上游图片权限不足。

404 · NOT_FOUND

指定图片模型不存在或不可用。

429 · RESOURCE_EXHAUSTED

并发或上游额度限制。

常见错误与排查
```

---

## 生成图片

官网页面： https://www.codex2api.com/docs/images-generate

```text
图片与批量任务
OpenAI
Grok
生成图片
复制 MD

使用 OpenAI Images 格式生成图片，响应为图片 URL 或 Base64。

POST
/v1/images/generations

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body：当前分组可用的图片模型 ID；请从模型目录确认。
prompt	string	是	Body：非空图片描述；编辑时描述期望的修改。
n	integer	否	Body：生成张数，默认 1，必须为正数；上限由模型和账号能力决定。
size	string	否	Body：图片尺寸，例如 1024x1024；可用尺寸、auto 和分辨率范围由上游决定。
quality	string	否	Body：质量档位，例如 auto；并非所有模型支持相同枚举。
response_format	string	否	Body：url 或 b64_json；具体结果格式取决于模型和账号。
background / output_format	string	否	Body：支持这些选项的模型可指定透明背景、PNG/JPEG/WebP 等输出格式。
output_compression / partial_images	integer	否	Body：压缩和流式预览选项；仅适用于支持相应原生能力的模型。
stream	boolean	否	Body：同步入口可按模型能力请求 SSE；异步入口必须为 false 或省略。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/images/generations" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-image-2",
  "prompt": "一幅山间日出的水彩画",
  "n": 1,
  "size": "1024x1024",
  "response_format": "url"
}'
JSON
复制
{
  "model": "gpt-image-2",
  "prompt": "一幅山间日出的水彩画",
  "n": 1,
  "size": "1024x1024",
  "response_format": "url"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

非流式成功响应；高级选项、usage 与 SSE 事件依模型和账号能力而异。

JSON
复制
{
  "created": 1790900000,
  "data": [
    {
      "url": "https://images.example.com/output.png"
    }
  ]
}
使用说明
仅 OpenAI 和 Grok 分组支持这些 Images URL；Gemini 图片使用原生 GenerateContent 或批量图片接口。
需要分组允许图片生成且账号支持相应图片能力；模型、尺寸和高级字段以当前配置及上游为准。
响应示例展示 URL 结果；b64_json 模式返回 data[].b64_json，usage 仅在上游提供或适配器可恢复时出现。
一次图片生成可能耗时较长。同步超时不代表上游未生成；避免盲目重复提交，可使用异步入口。
兼容路径
/images/generations
常见错误与排查
400 · invalid_request_error

模型、图片、n、stream 类型或其他参数不合法。

403 · permission_error

分组未开启图片生成。

404 · not_found_error

当前分组平台不支持 Images 接口。

503 · api_error

无满足模型与图片能力的可用账号。

常见错误与排查
```

---

## 编辑图片

官网页面： https://www.codex2api.com/docs/images-edit

```text
图片与批量任务
OpenAI
Grok
编辑图片
复制 MD

提交参考图片与提示词，返回编辑后的图片。

POST
/v1/images/edits

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json 或 multipart/form-data

参数	类型	必填	说明
model	string	是	Body：当前分组可用的图片模型 ID；请从模型目录确认。
prompt	string	是	Body：非空图片描述；编辑时描述期望的修改。
n	integer	否	Body：生成张数，默认 1，必须为正数；上限由模型和账号能力决定。
size	string	否	Body：图片尺寸，例如 1024x1024；可用尺寸、auto 和分辨率范围由上游决定。
quality	string	否	Body：质量档位，例如 auto；并非所有模型支持相同枚举。
response_format	string	否	Body：url 或 b64_json；具体结果格式取决于模型和账号。
background / output_format	string	否	Body：支持这些选项的模型可指定透明背景、PNG/JPEG/WebP 等输出格式。
output_compression / partial_images	integer	否	Body：压缩和流式预览选项；仅适用于支持相应原生能力的模型。
stream	boolean	否	Body：同步入口可按模型能力请求 SSE；异步入口必须为 false 或省略。
images[].image_url	string	条件必填	JSON Body：OpenAI 编辑格式，传入图片 URL 或 data URL。不能使用 images[].file_id。
mask.image_url	string	否	JSON Body：可选遮罩 URL；不支持 mask.file_id。
image / image[] / mask	file	条件必填	Multipart Form：上传待编辑图片与可选遮罩。JSON 与 multipart 二选一；Grok 原生编辑字段按实际上游支持保留。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/images/edits" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-raw '{
  "model": "gpt-image-2",
  "prompt": "把背景改为日落时的海边",
  "images": [
    {
      "image_url": "https://images.example.com/input.png"
    }
  ],
  "n": 1
}'
JSON
复制
{
  "model": "gpt-image-2",
  "prompt": "把背景改为日落时的海边",
  "images": [
    {
      "image_url": "https://images.example.com/input.png"
    }
  ],
  "n": 1
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "created": 1790900000,
  "data": [
    {
      "url": "https://images.example.com/output.png"
    }
  ]
}
使用说明
仅 OpenAI 和 Grok 分组支持这些 Images URL；Gemini 图片使用原生 GenerateContent 或批量图片接口。
需要分组允许图片生成且账号支持相应图片能力；模型、尺寸和高级字段以当前配置及上游为准。
响应示例展示 URL 结果；b64_json 模式返回 data[].b64_json，usage 仅在上游提供或适配器可恢复时出现。
一次图片生成可能耗时较长。同步超时不代表上游未生成；避免盲目重复提交，可使用异步入口。
JSON 示例为 OpenAI 编辑形状。multipart 客户端应让 SDK 自动生成 boundary，不要手写不带 boundary 的 Content-Type。
兼容路径
/images/edits
常见错误与排查
400 · invalid_request_error

模型、图片、n、stream 类型或其他参数不合法。

403 · permission_error

分组未开启图片生成。

404 · not_found_error

当前分组平台不支持 Images 接口。

503 · api_error

无满足模型与图片能力的可用账号。

常见错误与排查
```

---

## 异步生成图片

官网页面： https://www.codex2api.com/docs/images-generate-async

```text
图片与批量任务
OpenAI
Grok
异步生成图片
复制 MD

立即返回图片任务 ID，再查询结果，避免长连接等待生成。

POST
/v1/images/generations/async

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body：当前分组可用的图片模型 ID；请从模型目录确认。
prompt	string	是	Body：非空图片描述；编辑时描述期望的修改。
n	integer	否	Body：生成张数，默认 1，必须为正数；上限由模型和账号能力决定。
size	string	否	Body：图片尺寸，例如 1024x1024；可用尺寸、auto 和分辨率范围由上游决定。
quality	string	否	Body：质量档位，例如 auto；并非所有模型支持相同枚举。
response_format	string	否	Body：url 或 b64_json；具体结果格式取决于模型和账号。
background / output_format	string	否	Body：支持这些选项的模型可指定透明背景、PNG/JPEG/WebP 等输出格式。
output_compression / partial_images	integer	否	Body：压缩和流式预览选项；仅适用于支持相应原生能力的模型。
stream	boolean	否	Body：同步入口可按模型能力请求 SSE；异步入口必须为 false 或省略。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/images/generations/async" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-image-2",
  "prompt": "一幅山间日出的水彩画",
  "size": "1024x1024",
  "n": 1
}'
JSON
复制
{
  "model": "gpt-image-2",
  "prompt": "一幅山间日出的水彩画",
  "size": "1024x1024",
  "n": 1
}
响应示例 HTTP 202

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "imgtask_example",
  "task_id": "imgtask_example",
  "object": "image.generation.task",
  "status": "processing",
  "created_at": 1790900000,
  "expires_at": 1790986400,
  "poll_url": "/v1/images/tasks/imgtask_example"
}
使用说明
需要管理员配置并启用图片对象存储；未启用时返回 404。提交成功返回 HTTP 202、Location 和 Retry-After: 3。
使用创建任务的同一个站内 API Key 查询。异步沿用同步接口的模型、路由和计费规则；不接受 stream=true。
完成和失败都通过任务状态表示。查询失败任务仍可能返回 HTTP 200，请检查 status、http_status 和 error。
创建和完成时分别保留 24 小时查询记录；图片链接有效期独立于任务期限。已持久化结果可跨重启查询，执行中的上游调用不能在重启后安全续跑。
执行中断或结果转存失败时可能已产生上游用量，不应仅根据 failed 自动重试。轮询不会再次生成或收费。
兼容路径
/images/generations/async
常见错误与排查
400 · invalid_request_error

模型、图片、n、stream 类型或其他参数不合法。

403 · permission_error

分组未开启图片生成。

404 · not_found_error

当前分组平台不支持 Images 接口。

503 · api_error

无满足模型与图片能力的可用账号。

503 · image_task_busy

异步待处理任务容量已满，按 Retry-After 提示稍后再提交。

常见错误与排查
```

---

## 异步编辑图片

官网页面： https://www.codex2api.com/docs/images-edit-async

```text
图片与批量任务
OpenAI
Grok
异步编辑图片
复制 MD

将图片编辑放到后台执行，使用同一个 Key 查询任务。

POST
/v1/images/edits/async

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json 或 multipart/form-data

参数	类型	必填	说明
model	string	是	Body：当前分组可用的图片模型 ID；请从模型目录确认。
prompt	string	是	Body：非空图片描述；编辑时描述期望的修改。
n	integer	否	Body：生成张数，默认 1，必须为正数；上限由模型和账号能力决定。
size	string	否	Body：图片尺寸，例如 1024x1024；可用尺寸、auto 和分辨率范围由上游决定。
quality	string	否	Body：质量档位，例如 auto；并非所有模型支持相同枚举。
response_format	string	否	Body：url 或 b64_json；具体结果格式取决于模型和账号。
background / output_format	string	否	Body：支持这些选项的模型可指定透明背景、PNG/JPEG/WebP 等输出格式。
output_compression / partial_images	integer	否	Body：压缩和流式预览选项；仅适用于支持相应原生能力的模型。
stream	boolean	否	Body：同步入口可按模型能力请求 SSE；异步入口必须为 false 或省略。
images[].image_url	string	条件必填	JSON Body：OpenAI 编辑格式，传入图片 URL 或 data URL。不能使用 images[].file_id。
mask.image_url	string	否	JSON Body：可选遮罩 URL；不支持 mask.file_id。
image / image[] / mask	file	条件必填	Multipart Form：上传待编辑图片与可选遮罩。JSON 与 multipart 二选一；Grok 原生编辑字段按实际上游支持保留。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/images/edits/async" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-raw '{
  "model": "gpt-image-2",
  "prompt": "将天空修改为星空",
  "images": [
    {
      "image_url": "https://images.example.com/input.png"
    }
  ]
}'
JSON
复制
{
  "model": "gpt-image-2",
  "prompt": "将天空修改为星空",
  "images": [
    {
      "image_url": "https://images.example.com/input.png"
    }
  ]
}
响应示例 HTTP 202

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "imgtask_example",
  "task_id": "imgtask_example",
  "object": "image.generation.task",
  "status": "processing",
  "created_at": 1790900000,
  "expires_at": 1790986400,
  "poll_url": "/v1/images/tasks/imgtask_example"
}
使用说明
需要管理员配置并启用图片对象存储；未启用时返回 404。提交成功返回 HTTP 202、Location 和 Retry-After: 3。
使用创建任务的同一个站内 API Key 查询。异步沿用同步接口的模型、路由和计费规则；不接受 stream=true。
完成和失败都通过任务状态表示。查询失败任务仍可能返回 HTTP 200，请检查 status、http_status 和 error。
创建和完成时分别保留 24 小时查询记录；图片链接有效期独立于任务期限。已持久化结果可跨重启查询，执行中的上游调用不能在重启后安全续跑。
执行中断或结果转存失败时可能已产生上游用量，不应仅根据 failed 自动重试。轮询不会再次生成或收费。
兼容路径
/images/edits/async
常见错误与排查
400 · invalid_request_error

模型、图片、n、stream 类型或其他参数不合法。

403 · permission_error

分组未开启图片生成。

404 · not_found_error

当前分组平台不支持 Images 接口。

503 · api_error

无满足模型与图片能力的可用账号。

常见错误与排查
```

---

## 查询异步图片任务

官网页面： https://www.codex2api.com/docs/images-task

```text
图片与批量任务
OpenAI
Grok
查询异步图片任务
复制 MD

查询处理状态、错误和最终图片结果。

GET
/v1/images/tasks/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id	string	是	Path：异步提交返回的 task_id；用真实任务 ID 替换示例 imgtask_example。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/images/tasks/imgtask_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

处理中 status=processing；失败 status=failed，并读取 http_status 与 error。image_url 是首张图片，完整数据在 result。

JSON
复制
{
  "id": "imgtask_example",
  "task_id": "imgtask_example",
  "object": "image.generation.task",
  "status": "completed",
  "created_at": 1790900000,
  "expires_at": 1790986400,
  "poll_url": "/v1/images/tasks/imgtask_example",
  "http_status": 200,
  "image_url": "https://images.example.com/output.png",
  "result": {
    "created": 1790900120,
    "data": [
      {
        "url": "https://images.example.com/output.png"
      }
    ]
  },
  "completed_at": 1790900120
}
使用说明
需要管理员配置并启用图片对象存储；未启用时返回 404。提交成功返回 HTTP 202、Location 和 Retry-After: 3。
使用创建任务的同一个站内 API Key 查询。异步沿用同步接口的模型、路由和计费规则；不接受 stream=true。
完成和失败都通过任务状态表示。查询失败任务仍可能返回 HTTP 200，请检查 status、http_status 和 error。
创建和完成时分别保留 24 小时查询记录；图片链接有效期独立于任务期限。已持久化结果可跨重启查询，执行中的上游调用不能在重启后安全续跑。
执行中断或结果转存失败时可能已产生上游用量，不应仅根据 failed 自动重试。轮询不会再次生成或收费。
兼容路径
/images/tasks/{task_id}
常见错误与排查
404 · not_found_error

任务不存在、已过期或不属于当前 API Key。

常见错误与排查
```

---

## 创建批量图片任务

官网页面： https://www.codex2api.com/docs/image-batch-create

```text
图片与批量任务
Gemini
创建批量图片任务
复制 MD

一次提交多条图片提示词，由 Gemini API 或 Vertex 批量执行。

POST
/v1/images/batches

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
Idempotency-Key	string	否	Header：建议为一次逻辑提交设置唯一键；相同键与相同内容复用任务，不同内容返回 409。
model	string	是	Body：从 /v1/images/batches/models 获取可用模型。
provider	string	否	Body：gemini_api 或 vertex；省略时自动选择兼容账号。
task_name	string	否	Body：任务名称，省略时自动生成。
parent_batch_id	string	否	Body：可选父任务 ID，用于关联批次。
items	array<object>	是	Body：非空条目列表；每条包含 prompt，可选 custom_id、output_count 和 reference_images。默认最大条目与输出总数均为 200，可由部署配置调整。
items[].prompt	string	是	Body：非空提示词；长度受部署配置限制。
items[].custom_id	string	否	Body：批次内唯一 ID，省略时自动生成。
items[].output_count	integer	否	Body：默认 1，默认每条最多 4；大于 1 时展开为带编号后缀的子条目。
items[].reference_images	array<object>	否	Body：每张包含 mime_type（image/png、image/jpeg、image/webp）以及 Base64 字符串 data 或 gs:// 的 file_uri，二选一；不是任意 HTTP 图片链接。
image_size	string	否	Body：当前仅接受 1K；省略使用默认值。
aspect_ratio	string	否	Body：宽高比，由实际模型验证。
response_mime_type	string	否	Body：输出 MIME，默认 image/png。
metadata	object<string,string>	否	Body：可选业务元数据。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/images/batches" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gemini-2.5-flash-image",
  "provider": "gemini_api",
  "task_name": "风景图片",
  "image_size": "1K",
  "items": [
    {
      "custom_id": "landscape_1",
      "prompt": "一幅水彩山景",
      "output_count": 1
    }
  ]
}'
JSON
复制
{
  "model": "gemini-2.5-flash-image",
  "provider": "gemini_api",
  "task_name": "风景图片",
  "image_size": "1K",
  "items": [
    {
      "custom_id": "landscape_1",
      "prompt": "一幅水彩山景",
      "output_count": 1
    }
  ]
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

创建成功为 HTTP 200。任务状态可为 queued、running、processing_results、settling、completed、failed、cancelled、output_deleted。

JSON
复制
{
  "id": "batch_example",
  "object": "image.batch",
  "task_name": "风景图片",
  "status": "queued",
  "model": "gemini-2.5-flash-image",
  "provider": "gemini_api",
  "item_count": 1,
  "success_count": 0,
  "fail_count": 0,
  "estimated_cost": 0.02,
  "hold_amount": 0.024,
  "actual_cost": null,
  "created_at": 1790900000,
  "submitted_at": 1790900000,
  "settled_at": null
}
使用说明
这是本站批量图片任务协议，不是 OpenAI /v1/batches 协议，也不同于 /images/generations/async。
需要全局启用、分组允许批量图片、兼容账号以及完整定价。先冻结预留金额，再按成功结果结算并释放差额。
示例金额仅展示字段结构，不代表实际价格。请以 estimated_cost、hold_amount、actual_cost 与站内价卡为准。
所有批量 URL 仅注册 /v1 前缀，不提供无前缀别名。查询、取消、下载和删除必须使用原 API Key。
常见错误与排查
404 · BATCH_IMAGE_DISABLED / BATCH_IMAGE_NOT_FOUND

批量功能未启用，或任务不存在、不属于当前用户与 API Key。

403 · BATCH_IMAGE_GROUP_DISABLED

当前分组未允许批量图片。

400 · BATCH_IMAGE_INVALID_ITEMS

请求条目、尺寸或参数不合法。

402 · BATCH_IMAGE_INSUFFICIENT_BALANCE

余额不足以冻结预留金额。

502 · BATCH_IMAGE_NO_ACCOUNT_AVAILABLE

没有兼容的 Gemini API Key 或 Vertex 账号。

409 · BATCH_IMAGE_IDEMPOTENCY_CONFLICT

同一个幂等键被用于不同请求。

常见错误与排查
```

---

## 批量图片模型目录

官网页面： https://www.codex2api.com/docs/image-batch-models

```text
图片与批量任务
Gemini
批量图片模型目录
复制 MD

列出当前 Key 可用于批量图片的模型和提供方。

GET
/v1/images/batches/models

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

此接口没有额外请求体；路径及查询参数以接口说明为准。

请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/images/batches/models" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "object": "list",
  "data": [
    {
      "id": "gemini-2.5-flash-image",
      "object": "image.batch.model",
      "provider": "gemini_api"
    }
  ]
}
使用说明
模型按当前 Key、分组和兼容账号过滤；复合 Key 的模型可能带分组前缀。
常见错误与排查
404 · BATCH_IMAGE_DISABLED / BATCH_IMAGE_NOT_FOUND

批量功能未启用，或任务不存在、不属于当前用户与 API Key。

403 · BATCH_IMAGE_GROUP_DISABLED

当前分组未允许批量图片。

400 · BATCH_IMAGE_INVALID_ITEMS

请求条目、尺寸或参数不合法。

402 · BATCH_IMAGE_INSUFFICIENT_BALANCE

余额不足以冻结预留金额。

502 · BATCH_IMAGE_NO_ACCOUNT_AVAILABLE

没有兼容的 Gemini API Key 或 Vertex 账号。

常见错误与排查
```

---

## 批量图片任务列表

官网页面： https://www.codex2api.com/docs/image-batch-list

```text
图片与批量任务
Gemini
批量图片任务列表
复制 MD

按状态、名称、下载状态或时间查询当前 Key 的批次。

GET
/v1/images/batches

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
status	string	否	Query：queued、running、processing_results、completed、failed、cancelled、output_deleted；省略或 all 为全部。
task_name	string	否	Query：任务名称筛选。
downloaded	boolean	否	Query：true 为已下载，false 为未下载；省略为全部。
from / to	string	否	Query：RFC3339 时间或 YYYY-MM-DD 日期。
limit	integer	否	Query：默认 20，有效范围 1–100。
cursor	string	否	Query：数字偏移量字符串；初始为 0，下一页加上本页数量。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/images/batches?limit=20&cursor=0" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "object": "list",
  "data": [
    {
      "id": "batch_example",
      "object": "image.batch",
      "task_name": "风景图片",
      "status": "queued",
      "model": "gemini-2.5-flash-image",
      "provider": "gemini_api",
      "item_count": 1,
      "success_count": 0,
      "fail_count": 0,
      "estimated_cost": 0.02,
      "hold_amount": 0.024,
      "actual_cost": null,
      "created_at": 1790900000,
      "submitted_at": 1790900000,
      "settled_at": null
    }
  ],
  "has_more": false
}
使用说明
这是本站批量图片任务协议，不是 OpenAI /v1/batches 协议，也不同于 /images/generations/async。
需要全局启用、分组允许批量图片、兼容账号以及完整定价。先冻结预留金额，再按成功结果结算并释放差额。
示例金额仅展示字段结构，不代表实际价格。请以 estimated_cost、hold_amount、actual_cost 与站内价卡为准。
所有批量 URL 仅注册 /v1 前缀，不提供无前缀别名。查询、取消、下载和删除必须使用原 API Key。
常见错误与排查
404 · BATCH_IMAGE_DISABLED / BATCH_IMAGE_NOT_FOUND

批量功能未启用，或任务不存在、不属于当前用户与 API Key。

403 · BATCH_IMAGE_GROUP_DISABLED

当前分组未允许批量图片。

400 · BATCH_IMAGE_INVALID_ITEMS

请求条目、尺寸或参数不合法。

402 · BATCH_IMAGE_INSUFFICIENT_BALANCE

余额不足以冻结预留金额。

502 · BATCH_IMAGE_NO_ACCOUNT_AVAILABLE

没有兼容的 Gemini API Key 或 Vertex 账号。

常见错误与排查
```

---

## 查询批量图片任务

官网页面： https://www.codex2api.com/docs/image-batch-get

```text
图片与批量任务
Gemini
查询批量图片任务
复制 MD

读取生成进度、成功失败数量和冻结/实际费用。

GET
/v1/images/batches/{id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/images/batches/batch_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "batch_example",
  "object": "image.batch",
  "task_name": "风景图片",
  "status": "completed",
  "model": "gemini-2.5-flash-image",
  "provider": "gemini_api",
  "item_count": 1,
  "success_count": 1,
  "fail_count": 0,
  "estimated_cost": 0.02,
  "hold_amount": 0.024,
  "actual_cost": 0.02,
  "created_at": 1790900000,
  "submitted_at": 1790900000,
  "settled_at": 1790900300
}
使用说明
这是本站批量图片任务协议，不是 OpenAI /v1/batches 协议，也不同于 /images/generations/async。
需要全局启用、分组允许批量图片、兼容账号以及完整定价。先冻结预留金额，再按成功结果结算并释放差额。
示例金额仅展示字段结构，不代表实际价格。请以 estimated_cost、hold_amount、actual_cost 与站内价卡为准。
所有批量 URL 仅注册 /v1 前缀，不提供无前缀别名。查询、取消、下载和删除必须使用原 API Key。
常见错误与排查
404 · BATCH_IMAGE_DISABLED / BATCH_IMAGE_NOT_FOUND

批量功能未启用，或任务不存在、不属于当前用户与 API Key。

403 · BATCH_IMAGE_GROUP_DISABLED

当前分组未允许批量图片。

400 · BATCH_IMAGE_INVALID_ITEMS

请求条目、尺寸或参数不合法。

402 · BATCH_IMAGE_INSUFFICIENT_BALANCE

余额不足以冻结预留金额。

502 · BATCH_IMAGE_NO_ACCOUNT_AVAILABLE

没有兼容的 Gemini API Key 或 Vertex 账号。

常见错误与排查
```

---

## 批量图片子任务

官网页面： https://www.codex2api.com/docs/image-batch-items

```text
图片与批量任务
Gemini
批量图片子任务
复制 MD

分页获取每条提示词的状态、图片数量与错误。

GET
/v1/images/batches/{id}/items

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
status	string	否	Query：pending、succeeded、failed；省略为全部。
limit	integer	否	Query：默认 100，有效范围 1–500。
cursor	string	否	Query：数字偏移量字符串，初始 0。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/images/batches/batch_example/items?limit=100&cursor=0" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "object": "list",
  "data": [
    {
      "custom_id": "landscape_1",
      "status": "succeeded",
      "prompt_preview": "一幅水彩山景",
      "mime_type": "image/png",
      "file_extension": "png",
      "image_count": 1,
      "error": null
    }
  ],
  "has_more": false
}
使用说明
这是本站批量图片任务协议，不是 OpenAI /v1/batches 协议，也不同于 /images/generations/async。
需要全局启用、分组允许批量图片、兼容账号以及完整定价。先冻结预留金额，再按成功结果结算并释放差额。
示例金额仅展示字段结构，不代表实际价格。请以 estimated_cost、hold_amount、actual_cost 与站内价卡为准。
所有批量 URL 仅注册 /v1 前缀，不提供无前缀别名。查询、取消、下载和删除必须使用原 API Key。
常见错误与排查
404 · BATCH_IMAGE_DISABLED / BATCH_IMAGE_NOT_FOUND

批量功能未启用，或任务不存在、不属于当前用户与 API Key。

403 · BATCH_IMAGE_GROUP_DISABLED

当前分组未允许批量图片。

400 · BATCH_IMAGE_INVALID_ITEMS

请求条目、尺寸或参数不合法。

402 · BATCH_IMAGE_INSUFFICIENT_BALANCE

余额不足以冻结预留金额。

502 · BATCH_IMAGE_NO_ACCOUNT_AVAILABLE

没有兼容的 Gemini API Key 或 Vertex 账号。

常见错误与排查
```

---

## 下载批量任务中的图片

官网页面： https://www.codex2api.com/docs/image-batch-content

```text
图片与批量任务
Gemini
下载批量任务中的图片
复制 MD

读取指定子任务的一张图片，返回图片二进制。

GET
/v1/images/batches/{id}/items/{custom_id}/content

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
custom_id	string	是	Path：子任务列表返回的 ID。
image_index	integer	否	Query：图片索引，从 0 开始；默认 0。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl "$BASE_URL/v1/images/batches/batch_example/items/landscape_1/content?image_index=0" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  --output landscape.png
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 200 OK
Content-Type: image/png
Content-Disposition: attachment; filename="landscape_1.png"

<图片二进制>
使用说明
使用真实 id 与 custom_id 替换示例 batch_example、landscape_1；响应是二进制，示例用 --output 保存到文件。
成功下载会标记批次下载时间。使用支持请求头的下载客户端，不要把 API Key 放到 URL。
常见错误与排查
409 · BATCH_IMAGE_NOT_READY / BATCH_IMAGE_ITEM_FAILED

批次尚未完成，或该子任务未成功。

410 · BATCH_IMAGE_OUTPUT_DELETED

结果已清理。

400 · BATCH_IMAGE_ITEM_IMAGE_INDEX_OUT_OF_RANGE

图片索引无效。

常见错误与排查
```

---

## 下载批量图片 ZIP

官网页面： https://www.codex2api.com/docs/image-batch-download

```text
图片与批量任务
Gemini
下载批量图片 ZIP
复制 MD

流式下载图片归档及结果清单。

GET
/v1/images/batches/{id}/download

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
max_items	integer	否	Query：归档条数上限；超过此值返回错误，不会截取部分成功图片。仍受服务端归档大小和条数限制。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl "$BASE_URL/v1/images/batches/batch_example/download" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  --output images.zip
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 200 OK
Content-Type: application/zip
Content-Disposition: attachment; filename="batch_example.zip"

<ZIP 二进制及结果清单>
使用说明
下载成功会更新下载标记。归档过大时改用逐项下载。归档包含成功图片及结果清单，当前不按 status 查询参数过滤。
常见错误与排查
409 · BATCH_IMAGE_NOT_READY

任务尚未完成。

400 · BATCH_IMAGE_ZIP_TOO_MANY_ITEMS / BATCH_IMAGE_DOWNLOAD_TOO_LARGE

归档超过服务器限制。

429 · BATCH_IMAGE_DOWNLOAD_LIMITED

并发下载超限。

常见错误与排查
```

---

## 取消批量图片任务

官网页面： https://www.codex2api.com/docs/image-batch-cancel

```text
图片与批量任务
Gemini
取消批量图片任务
复制 MD

请求上游取消任务，并按最终确认结果处理费用。

POST
/v1/images/batches/{id}/cancel

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/images/batches/batch_example/cancel" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

返回当前任务对象；取消请求成功不保证上游所有条目都未执行，应继续查询最终状态与 actual_cost。

JSON
复制
{
  "id": "batch_example",
  "object": "image.batch",
  "task_name": "风景图片",
  "status": "cancelled",
  "model": "gemini-2.5-flash-image",
  "provider": "gemini_api",
  "item_count": 1,
  "success_count": 0,
  "fail_count": 0,
  "estimated_cost": 0.02,
  "hold_amount": 0.024,
  "actual_cost": null,
  "created_at": 1790900000,
  "submitted_at": 1790900000,
  "settled_at": null
}
使用说明
这是本站批量图片任务协议，不是 OpenAI /v1/batches 协议，也不同于 /images/generations/async。
需要全局启用、分组允许批量图片、兼容账号以及完整定价。先冻结预留金额，再按成功结果结算并释放差额。
示例金额仅展示字段结构，不代表实际价格。请以 estimated_cost、hold_amount、actual_cost 与站内价卡为准。
所有批量 URL 仅注册 /v1 前缀，不提供无前缀别名。查询、取消、下载和删除必须使用原 API Key。
常见错误与排查
404 · BATCH_IMAGE_DISABLED / BATCH_IMAGE_NOT_FOUND

批量功能未启用，或任务不存在、不属于当前用户与 API Key。

403 · BATCH_IMAGE_GROUP_DISABLED

当前分组未允许批量图片。

400 · BATCH_IMAGE_INVALID_ITEMS

请求条目、尺寸或参数不合法。

402 · BATCH_IMAGE_INSUFFICIENT_BALANCE

余额不足以冻结预留金额。

502 · BATCH_IMAGE_NO_ACCOUNT_AVAILABLE

没有兼容的 Gemini API Key 或 Vertex 账号。

502 · BATCH_IMAGE_CANCEL_FAILED

上游取消失败或当前任务无法取消。

常见错误与排查
```

---

## 删除批量任务记录

官网页面： https://www.codex2api.com/docs/image-batch-delete

```text
图片与批量任务
Gemini
删除批量任务记录
复制 MD

移除已终结的批次记录；不会取消仍在运行的任务。

DELETE
/v1/images/batches/{id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X DELETE "$BASE_URL/v1/images/batches/batch_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例 HTTP 204

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 204 No Content
使用说明
此操作删除记录，不会改写已完成的结算。运行中的任务应先取消并等待终结。
常见错误与排查
409 · BATCH_IMAGE_RECORD_DELETE_NOT_READY

任务未终结，暂不可删除。

404 · BATCH_IMAGE_NOT_FOUND

任务不存在或不属于当前 Key。

常见错误与排查
```

---

## 清理批量任务产物

官网页面： https://www.codex2api.com/docs/image-batch-delete-outputs

```text
图片与批量任务
Gemini
清理批量任务产物
复制 MD

删除已完成批次的输出图片，保留任务和费用记录。

DELETE
/v1/images/batches/{id}/outputs

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
id	string	是	Path：创建批量任务返回的 id；将示例 batch_example 替换为真实值，并使用创建任务的同一个站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X DELETE "$BASE_URL/v1/images/batches/batch_example/outputs" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "batch_example",
  "object": "image.batch",
  "task_name": "风景图片",
  "status": "output_deleted",
  "model": "gemini-2.5-flash-image",
  "provider": "gemini_api",
  "item_count": 1,
  "success_count": 0,
  "fail_count": 0,
  "estimated_cost": 0.02,
  "hold_amount": 0.024,
  "actual_cost": null,
  "created_at": 1790900000,
  "submitted_at": 1790900000,
  "settled_at": null,
  "output_deleted_at": 1790900400
}
使用说明
仅已完成任务可清理。清理后图片不可继续下载；不会退还已产生的生成费用。
常见错误与排查
409 · BATCH_IMAGE_OUTPUT_DELETE_NOT_READY

任务尚未完成。

502 · BATCH_IMAGE_CLEANUP_FAILED

上游结果清理失败。

常见错误与排查
```

---

## Video · 创建 OpenAI Videos 任务

官网页面： https://www.codex2api.com/docs/video-create

```text
视频与异步任务
OpenAI Videos
Video
Grok
Video · 创建 OpenAI Videos 任务
复制 MD

使用 /v1/videos 创建异步 JSON 视频任务。Video 分组返回本站任务对象；同名 Grok 入口仍使用 xAI 任务格式。

POST
/v1/videos

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	模型广场中当前分组可用的模型 ID。
prompt	string	条件必填	视频生成提示词，遵循实际供应商的内容限制。
seconds	number / string	条件必填	生成时长（秒），支持数值或规范数字字符串；与 duration 同时填写时必须一致。合法时长由上游决定。
size	string	条件必填	精确尺寸，如 1280x720、720x1280。默认按精确尺寸价档或已配置兜底价计费，不自动按短边降档。秘塔 H3 适配将这两个尺寸对应到 768p，将 1792x1024、1024x1792 对应到 2K。
input_reference.image_url	string	否	单张参考图片的可访问 URL 或上游支持的图片 Data URL，计入参考图片附加费。优先采用稳定可访问的 URL，避免大体积 Base64 上传超时。
duration / resolution / ratio / images	JSON	否	旧中继字段仅在实际上游支持时使用；管理员显式选择“秘塔 H3”适配后可转换为规范字段。H3 仅支持单张参考图；不要同时填写冲突的字段或重复表示参考图。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/videos" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "video-model",
  "prompt": "一只小猫在雪地追逐雪花，电影镜头",
  "seconds": 8,
  "size": "1280x720"
}'
JSON
复制
{
  "model": "video-model",
  "prompt": "一只小猫在雪地追逐雪花，电影镜头",
  "seconds": 8,
  "size": "1280x720"
}
响应示例 HTTP 200

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例是 Video 分组的成功受理响应；Grok 分组通常返回 request_id，见 Grok 视频生成。受理成功只代表任务已创建。

JSON
复制
{
  "id": "vid_example",
  "object": "video",
  "model": "video-model",
  "status": "queued",
  "created_at": 1750000000,
  "billing_status": "reserved",
  "duration": 8,
  "resolution": "720p"
}
使用说明
Video 账号必须明确勾选 OpenAI Videos（/v1/videos），且模型允许使用该端点，才能调用此入口。未启用时该入口不可用，不会回退到其他端点。请求体遵循该上游端点的参数约定。
秘塔 H3 账号需由管理员选择“秘塔 H3”参数适配，才能转换旧参数并使用 768p/2K 价档；默认透传不会按域名或模型名自动启用。Grok 分组仍按其专用参数约定调用。
状态为 queued（排队）、in_progress（生成中）、completed（完成）、failed（失败）。受理不明或过期还会返回 task_status，不能把 in_progress 直接当成可重试。
接口只接收 JSON；没有开放 GET /v1/videos 集合列表、multipart、remix 或 DELETE /v1/videos/{id}。任务列表请使用站内任务记录页面。
按秒模式预留预计视频费；按次模式预留一次成功任务费。Token 模式可按模型配置先用独立秒价预扣，也可完成后结算。最终按任务创建时冻结的价卡、实际用量和适用倍率结算；参考图片附加费为固定金额。
缺少价格会阻止提交，缺少可信 Token 用量会进入待核对，不能按零费用处理。完成、失败和退款请同时检查 status 与 billing_status。
创建完整收到 HTTP 4xx/5xx 且没有上游任务 ID 时，独立 Video 任务失败并释放预扣。新任务若创建超时且没有任务 ID 或持久响应证据，核对 15 分钟后按失败释放，不自动重发；提交进程中断且满足同样条件时按已保存的创建截止时间起算。已取得 ID、响应读取失败、冲突 ID、成功响应缺 ID 或缺少分类的旧任务仍需核对；查询错误不会自动退款。
兼容路径
/videos
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Video · 查询 OpenAI Videos 任务

官网页面： https://www.codex2api.com/docs/video-query

```text
视频与异步任务
OpenAI Videos
Video
Grok
Video · 查询 OpenAI Videos 任务
复制 MD

用本站任务 ID 查询进度和账务状态。Grok 任务 ID 同路径仍由原 Grok 链路处理。

GET
/v1/videos/{video_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/videos/vid_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

HTTP 200 表示查到任务；status=failed 仍可返回 HTTP 200，并附 error.code 和 error.message。seconds、size、duration、resolution、usage 仅在已知时返回，实际终态秒数用于按秒结算。

JSON
复制
{
  "id": "vid_example",
  "object": "video",
  "model": "video-model",
  "status": "completed",
  "created_at": 1750000000,
  "billing_status": "settled",
  "duration": 8,
  "resolution": "720p",
  "completed_at": 1750000060,
  "usage": {
    "completion_tokens": 80770
  }
}
使用说明
billing_status=settled 表示已结算，released 表示预留已释放，reconciliation 表示待核对，reserved 表示预算仍预留。生成状态和账务状态应分开判断。
Video 任务有后台恢复轮询。重复查询不会重新 POST 生成；原生任务也可通过 X-Video-Task-ID 对应的本站 ID 查询。
Grok 创建只保存任务和计费信息；后续查询或 content 下载观察到 status=done 且存在 video.url 时才尝试结算。请主动轮询，任务记录列表本身不会查询上游或触发扣费。
必须用原 Key 查询，任务始终回到原账号。归属缓存保留约 24 小时，请及时获取结果；重复查询和下载使用任务幂等结算，不新增生成费用。
兼容路径
/videos/{video_id}
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## Video · 下载或播放视频

官网页面： https://www.codex2api.com/docs/video-content

```text
视频与异步任务
OpenAI Videos
Video
Grok
Video · 下载或播放视频
复制 MD

读取原任务的视频字节流，保留鉴权，不把上游账号凭据交给调用方。

GET
/v1/videos/{video_id}/content

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
Range（请求头）	string	否	单段字节范围，例如 bytes=0-1048575；不能使用多段 Range。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/videos/vid_example/content" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

完整内容通常为 200，部分内容为 206，范围不可满足为 416。不是 JSON 响应。

text
复制
HTTP/1.1 200 OK
Content-Type: video/mp4
Cache-Control: private, no-store

<视频二进制内容>
使用说明
独立 Video 仅允许已完成且 billing_status=settled 的任务下载，未完成或待核对返回 409；本接口不补查上游任务、不补扣。
Grok content 会先查询原任务状态，并可能触发首次完成结算。两种分组的行为不同。
独立 Video 下载支持最长两分钟、最大 512 MiB 的只读流。先用带 Bearer 的服务端或 SDK 请求下载，再按需要保存；不要把站内密钥放进视频 URL。
兼容路径
/videos/{video_id}/content
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

400 · VIDEO_CONTENT_RANGE_INVALID

Range 不是合法单段字节范围。

502 · VIDEO_CONTENT_UNAVAILABLE

产物地址过期、不安全或无法获取有效视频内容。

常见错误与排查
```

---

## Video · 兼容视频创建

官网页面： https://www.codex2api.com/docs/video-compat-create

```text
视频与异步任务
OpenAI Videos
Video
Video · 兼容视频创建
复制 MD

原有 /v1/video/generations 统一 URL，参数继续遵循实际供应商，返回本站异步任务。

POST
/v1/video/generations

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	模型广场中当前分组可用的模型 ID，必须已有可用账号和匹配视频定价。
prompt / content / input	string / array / object	条件必填	按实际选中上游填写文本或多模态输入。统一入口不会把 prompt 转成 Ark content 或 Wan input。
duration	number	条件必填	视频时长（秒）。上游支持范围由模型决定；自动时长或省略时按秒预扣必须有管理员配置的预留时长。Wan 原生字段通常位于 parameters.duration。
resolution	string	条件必填	按上游支持档位填写，如 480p、720p、768p、1080p；与价卡匹配，不会自动降档。存在分辨率价卡时需要提供明确分辨率。
ratio / aspect_ratio	string	否	按供应商约定选择字段，如 16:9 或 9:16；网关不互相改写这两个字段。
images / image_urls / content	array	否	按上游协议提供参考图片。若价卡启用图片附加费，按可识别输入数量计费；避免同时提交互相冲突的图片表示。
videos / video_url / content	array / string / array	否	按上游协议提供参考视频；同一分辨率统一单价，不区分是否携带参考视频。参考图片附加费按模型配置单独计算。
generate_audio / watermark / seed	boolean / boolean / number	否	可选厂商参数，是否支持、默认值和合法范围由模型与上游决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/video/generations" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "video-model",
  "prompt": "落日下的海岸，镜头缓慢推进",
  "duration": 8,
  "resolution": "720p",
  "ratio": "16:9"
}'
JSON
复制
{
  "model": "video-model",
  "prompt": "落日下的海岸，镜头缓慢推进",
  "duration": 8,
  "resolution": "720p",
  "ratio": "16:9"
}
响应示例 HTTP 200

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "vid_example",
  "task_id": "vid_example",
  "object": "video.generation",
  "model": "video-model",
  "status": "queued",
  "billing_status": "reserved",
  "data": [],
  "created": 1750000000
}
使用说明
此处是单数 video；/v1/videos/generations 是 Grok 入口，不能互换。
账号必须明确勾选 OpenAI Videos（/v1/video/generations），且模型允许使用该端点；未启用时不会回退到其他端点。仅启用原生协议时请调用对应原生路径，不会自动互转 input/content/prompt。
返回 vid_… ID；不要把本地 ID 直接用于供应商网站查询。轮询使用本平台的 /v1/video/generations/{task_id} 或 /v1/tasks/{task_id}。
按秒模式预留预计视频费；按次模式预留一次成功任务费。Token 模式可按模型配置先用独立秒价预扣，也可完成后结算。最终按任务创建时冻结的价卡、实际用量和适用倍率结算；参考图片附加费为固定金额。
缺少价格会阻止提交，缺少可信 Token 用量会进入待核对，不能按零费用处理。完成、失败和退款请同时检查 status 与 billing_status。
创建完整收到 HTTP 4xx/5xx 且没有上游任务 ID 时，独立 Video 任务失败并释放预扣。新任务若创建超时且没有任务 ID 或持久响应证据，核对 15 分钟后按失败释放，不自动重发；提交进程中断且满足同样条件时按已保存的创建截止时间起算。已取得 ID、响应读取失败、冲突 ID、成功响应缺 ID 或缺少分类的旧任务仍需核对；查询错误不会自动退款。
兼容路径
/video/generations
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Video · 兼容任务查询

官网页面： https://www.codex2api.com/docs/video-compat-query

```text
视频与异步任务
OpenAI Videos
Video
Video · 兼容任务查询
复制 MD

查询 Video 任务与费用释放、结算状态；返回 video.generation 对象。

GET
/v1/video/generations/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/video/generations/vid_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "vid_example",
  "task_id": "vid_example",
  "object": "video.generation",
  "model": "video-model",
  "status": "completed",
  "billing_status": "settled",
  "data": [
    {
      "url": "https://media.example.com/output.mp4"
    }
  ],
  "created": 1750000000,
  "usage": {
    "completion_tokens": 80770
  }
}
使用说明
可能状态包含 pending、queued、processing、completed、failed、cancelled、unknown、expired；与 /v1/videos 的四态表达不同。
data[].url 仅在生成完成且存在可公开输出的产物地址时提供，可能带时效；没有 URL 不代表可以忽略 billing_status。
unknown 为受理不明，expired 可能需要成本核对；保留原任务 ID 联系管理员，不要直接再创建。
任务查询本身不重新生成；持久任务和账务恢复由后台推进。
兼容路径
/video/generations/{task_id}
/v1/tasks/{task_id}
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## Video · 取消任务

官网页面： https://www.codex2api.com/docs/video-compat-cancel

```text
视频与异步任务
OpenAI Videos
Video
Video · 取消任务
复制 MD

请求取消尚未结束的任务；只有实际上游支持且确认取消后，才释放预留。

DELETE
/v1/video/generations/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X DELETE "$BASE_URL/v1/video/generations/vid_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例表示上游已确认取消且释放成功；取消请求不保证任务停止，也不保证立即退款。

JSON
复制
{
  "id": "vid_example",
  "task_id": "vid_example",
  "object": "video.generation",
  "model": "video-model",
  "status": "cancelled",
  "billing_status": "released",
  "data": [],
  "created": 1750000000
}
使用说明
当前仅 compat 和 Seedance 端点支持取消；OpenAI Videos、Kling、Wan、MiniMax 未开放取消契约。
任务已完成、已失败、已取消、处于冲突状态或没有上游 ID 时可能返回 409。上游 HTTP 200 中的业务错误或仍在处理状态不等于取消成功。
确认 cancelled/canceled/deleted、Seedance 成功空删除包或 compat 204 才能作为取消依据；失败释放使用同一任务账本，重复请求不会重复退款。
兼容路径
/video/generations/{task_id}
/v1/tasks/{task_id}
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

400 · VIDEO_CANCEL_UNSUPPORTED

该任务实际使用的上游端点不支持取消。

常见错误与排查
```

---

## Seedance / 方舟 · 创建原生任务

官网页面： https://www.codex2api.com/docs/ark-create

```text
视频与异步任务
Seedance / 火山方舟
Video
OpenAI
Seedance / 方舟 · 创建原生任务
复制 MD

使用 Ark content 多模态数组提交视频任务，保留方舟原生请求与响应。

POST
/api/v3/contents/generations/tasks

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	已配置的视频模型或方舟推理接入点 ID。
content	array	是	非空多模态数组。文本为 {type:"text",text:"..."}，图片/视频等按模型原生格式提供 type 与对应 URL 对象。
duration	number	条件必填	秒数或模型允许的自动时长值，范围由模型决定；自动时长需满足本站预算配置。
resolution / ratio	string	条件必填	按模型支持范围填写分辨率与比例；分辨率需匹配已配置价卡。
generate_audio / watermark / seed	boolean / boolean / number	否	方舟模型扩展参数，保持原生格式。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/api/v3/contents/generations/tasks" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "seedance-model-or-endpoint-id",
  "content": [
    {
      "type": "text",
      "text": "小猫在雪地里追逐雪花"
    }
  ],
  "duration": 8,
  "resolution": "720p",
  "ratio": "16:9",
  "watermark": false
}'
JSON
复制
{
  "model": "seedance-model-or-endpoint-id",
  "content": [
    {
      "type": "text",
      "text": "小猫在雪地里追逐雪花"
    }
  ],
  "duration": 8,
  "resolution": "720p",
  "ratio": "16:9",
  "watermark": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

上游成功状态和响应原样返回，通常通过 id 获取供应商任务 ID。Video 链路另提供 X-Video-Task-ID。

JSON
复制
{
  "id": "cgt_example"
}
使用说明
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
Video 分组使用独立任务、持久轮询与视频价卡。OpenAI 分组要求 API Key 账号显式启用 Seedance 能力并配置 Base URL，走旧链路，不能套用独立 Video 预扣规则。
旧 OpenAI Seedance 任务需客户端在归属有效期内主动查询：成功状态 succeeded 且 usage.completion_tokens>0 才按输出 Token 计费。任务记录页面不会替代这次查询；Idempotency-Key 的本站去重能力仅适用于 Video 链路。
兼容路径
/v3/contents/generations/tasks
/v1/contents/generations/tasks
/contents/generations/tasks
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

503 · TaskStorageUnavailable

旧 OpenAI Seedance 已创建任务但归属存储失败，响应携带任务 ID；保留 ID 联系管理员，不可再次提交生成。

常见错误与排查
```

---

## Seedance / 方舟 · 查询原生任务

官网页面： https://www.codex2api.com/docs/ark-query

```text
视频与异步任务
Seedance / 火山方舟
Video
OpenAI
Seedance / 方舟 · 查询原生任务
复制 MD

取得方舟原生状态、产物和 usage；原生 ID 与创建 Key 必须匹配。

GET
/api/v3/contents/generations/tasks/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/api/v3/contents/generations/tasks/cgt_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "cgt_example",
  "model": "seedance-model-or-endpoint-id",
  "status": "succeeded",
  "content": {
    "video_url": "https://media.example.com/output.mp4"
  },
  "usage": {
    "completion_tokens": 80770
  }
}
使用说明
原生排队、运行、成功和失败状态遵循供应商响应，例如 queued、running、succeeded、failed；不要把 HTTP 200 直接当生成成功。
Video 后台会持续查询并按冻结价格结算；旧 OpenAI Seedance 依赖调用方查询，归属及待结算快照约保留 24 小时。
原生响应中的上游模型名不还原为客户端别名；产物链接可能过期，获取后按需保存。
兼容路径
/v3/contents/generations/tasks/{task_id}
/v1/contents/generations/tasks/{task_id}
/contents/generations/tasks/{task_id}
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## Seedance / 方舟 · 删除原生任务

官网页面： https://www.codex2api.com/docs/ark-delete

```text
视频与异步任务
Seedance / 火山方舟
Video
OpenAI
Seedance / 方舟 · 删除原生任务
复制 MD

向原任务账号提交原生删除请求，保留供应商状态及响应。

DELETE
/api/v3/contents/generations/tasks/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X DELETE "$BASE_URL/api/v3/contents/generations/tasks/cgt_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例 HTTP 204

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

空成功响应仅为一种供应商结果；实际 HTTP 状态与正文以上游为准。

text
复制
HTTP/1.1 204 No Content
使用说明
Video 链路需确认删除成功才释放预算；已生成完成的任务不能因为删除请求而撤销结算。
旧 OpenAI Seedance 链路没有独立 Video 的预扣账本，删除不构成已结算用量退款。
保留任务 ID 核对响应，不对上游 HTTP 200 中的业务失败作成功取消处理。
兼容路径
/v3/contents/generations/tasks/{task_id}
/v1/contents/generations/tasks/{task_id}
/contents/generations/tasks/{task_id}
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## Kling · 模型路径文生视频

官网页面： https://www.codex2api.com/docs/kling-text

```text
视频与异步任务
Kling / 可灵
Video
Kling · 模型路径文生视频
复制 MD

显式选择 Kling 操作路径，视频参数按该上游的原生 JSON 合同提供。

POST
/text-to-video/{model}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	否	模型路径已提供 model 时正文可省略；两处同时提供必须一致。固定路径必须提供非空 model，不能只用 model_name 替代本站模型字段。
prompt	string	条件必填	描述视频内容；具体操作是否必填由上游模型决定。
image / image_tail / image_list	string / array	否	图生、首尾帧或 Omni 参考图按上游选择对应字段，本站保留原结构，不自动把图片数组转换成另一种协议。
duration	number	条件必填	本站计费需要可解析的数字秒数；合法生成时长由上游模型决定。
resolution / aspect_ratio / mode	string	条件必填	分辨率需匹配本站价格。mode 如 std/pro 按上游定义；本站不自动把 mode 推断为具体分辨率。
其他厂商字段	JSON	否	如 negative_prompt、camera_control、seed，是否支持由具体上游决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/text-to-video/kling-video-model" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}'
JSON
复制
{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

原生回包示例，任务 ID 常见于 data.task_id；上游有不同结构时保持原样。

JSON
复制
{
  "code": 0,
  "data": {
    "task_id": "kling_task_example",
    "task_status": "submitted"
  }
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
这些是不同操作入口，不是可随意互换的别名。后续统一用 GET /tasks?task_ids={task_id} 查询；Kling 取消和私有文件下载端点没有在本项目开放。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Kling · 模型路径图生视频

官网页面： https://www.codex2api.com/docs/kling-image

```text
视频与异步任务
Kling / 可灵
Video
Kling · 模型路径图生视频
复制 MD

显式选择 Kling 操作路径，视频参数按该上游的原生 JSON 合同提供。

POST
/image-to-video/{model}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	否	模型路径已提供 model 时正文可省略；两处同时提供必须一致。固定路径必须提供非空 model，不能只用 model_name 替代本站模型字段。
prompt	string	条件必填	描述视频内容；具体操作是否必填由上游模型决定。
image / image_tail / image_list	string / array	是	图生、首尾帧或 Omni 参考图按上游选择对应字段，本站保留原结构，不自动把图片数组转换成另一种协议。
duration	number	条件必填	本站计费需要可解析的数字秒数；合法生成时长由上游模型决定。
resolution / aspect_ratio / mode	string	条件必填	分辨率需匹配本站价格。mode 如 std/pro 按上游定义；本站不自动把 mode 推断为具体分辨率。
其他厂商字段	JSON	否	如 negative_prompt、camera_control、seed，是否支持由具体上游决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/image-to-video/kling-video-model" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p",
  "image": "https://media.example.com/first-frame.png"
}'
JSON
复制
{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p",
  "image": "https://media.example.com/first-frame.png"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

原生回包示例，任务 ID 常见于 data.task_id；上游有不同结构时保持原样。

JSON
复制
{
  "code": 0,
  "data": {
    "task_id": "kling_task_example",
    "task_status": "submitted"
  }
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
这些是不同操作入口，不是可随意互换的别名。后续统一用 GET /tasks?task_ids={task_id} 查询；Kling 取消和私有文件下载端点没有在本项目开放。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Kling · 模型路径 Omni 视频

官网页面： https://www.codex2api.com/docs/kling-omni

```text
视频与异步任务
Kling / 可灵
Video
Kling · 模型路径 Omni 视频
复制 MD

显式选择 Kling 操作路径，视频参数按该上游的原生 JSON 合同提供。

POST
/omni-video/{model}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	否	模型路径已提供 model 时正文可省略；两处同时提供必须一致。固定路径必须提供非空 model，不能只用 model_name 替代本站模型字段。
prompt	string	条件必填	描述视频内容；具体操作是否必填由上游模型决定。
image / image_tail / image_list	string / array	否	图生、首尾帧或 Omni 参考图按上游选择对应字段，本站保留原结构，不自动把图片数组转换成另一种协议。
duration	number	条件必填	本站计费需要可解析的数字秒数；合法生成时长由上游模型决定。
resolution / aspect_ratio / mode	string	条件必填	分辨率需匹配本站价格。mode 如 std/pro 按上游定义；本站不自动把 mode 推断为具体分辨率。
其他厂商字段	JSON	否	例如 Omni 的参考视频、音频及 camera_control，遵循实际厂商文档。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/omni-video/kling-video-model" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}'
JSON
复制
{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

原生回包示例，任务 ID 常见于 data.task_id；上游有不同结构时保持原样。

JSON
复制
{
  "code": 0,
  "data": {
    "task_id": "kling_task_example",
    "task_status": "submitted"
  }
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
这些是不同操作入口，不是可随意互换的别名。后续统一用 GET /tasks?task_ids={task_id} 查询；Kling 取消和私有文件下载端点没有在本项目开放。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Kling · 原生 text2video

官网页面： https://www.codex2api.com/docs/kling-text2video

```text
视频与异步任务
Kling / 可灵
Video
Kling · 原生 text2video
复制 MD

显式选择 Kling 操作路径，视频参数按该上游的原生 JSON 合同提供。

POST
/v1/videos/text2video

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	模型路径已提供 model 时正文可省略；两处同时提供必须一致。固定路径必须提供非空 model，不能只用 model_name 替代本站模型字段。
prompt	string	条件必填	描述视频内容；具体操作是否必填由上游模型决定。
image / image_tail / image_list	string / array	否	图生、首尾帧或 Omni 参考图按上游选择对应字段，本站保留原结构，不自动把图片数组转换成另一种协议。
duration	number	条件必填	本站计费需要可解析的数字秒数；合法生成时长由上游模型决定。
resolution / aspect_ratio / mode	string	条件必填	分辨率需匹配本站价格。mode 如 std/pro 按上游定义；本站不自动把 mode 推断为具体分辨率。
其他厂商字段	JSON	否	如 negative_prompt、camera_control、seed，是否支持由具体上游决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/videos/text2video" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}'
JSON
复制
{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

原生回包示例，任务 ID 常见于 data.task_id；上游有不同结构时保持原样。

JSON
复制
{
  "code": 0,
  "data": {
    "task_id": "kling_task_example",
    "task_status": "submitted"
  }
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
这些是不同操作入口，不是可随意互换的别名。后续统一用 GET /tasks?task_ids={task_id} 查询；Kling 取消和私有文件下载端点没有在本项目开放。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Kling · 原生 Omni 视频

官网页面： https://www.codex2api.com/docs/kling-native-omni

```text
视频与异步任务
Kling / 可灵
Video
Kling · 原生 Omni 视频
复制 MD

显式选择 Kling 操作路径，视频参数按该上游的原生 JSON 合同提供。

POST
/v1/videos/omni-video

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	模型路径已提供 model 时正文可省略；两处同时提供必须一致。固定路径必须提供非空 model，不能只用 model_name 替代本站模型字段。
prompt	string	条件必填	描述视频内容；具体操作是否必填由上游模型决定。
image / image_tail / image_list	string / array	否	图生、首尾帧或 Omni 参考图按上游选择对应字段，本站保留原结构，不自动把图片数组转换成另一种协议。
duration	number	条件必填	本站计费需要可解析的数字秒数；合法生成时长由上游模型决定。
resolution / aspect_ratio / mode	string	条件必填	分辨率需匹配本站价格。mode 如 std/pro 按上游定义；本站不自动把 mode 推断为具体分辨率。
其他厂商字段	JSON	否	例如 Omni 的参考视频、音频及 camera_control，遵循实际厂商文档。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/videos/omni-video" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}'
JSON
复制
{
  "model": "kling-video-model",
  "prompt": "海边灯塔，镜头缓慢向前",
  "duration": 5,
  "resolution": "720p"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

原生回包示例，任务 ID 常见于 data.task_id；上游有不同结构时保持原样。

JSON
复制
{
  "code": 0,
  "data": {
    "task_id": "kling_task_example",
    "task_status": "submitted"
  }
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
这些是不同操作入口，不是可随意互换的别名。后续统一用 GET /tasks?task_ids={task_id} 查询；Kling 取消和私有文件下载端点没有在本项目开放。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Kling · 查询单个任务

官网页面： https://www.codex2api.com/docs/kling-query

```text
视频与异步任务
Kling / 可灵
Video
Kling · 查询单个任务
复制 MD

使用 task_ids 查询原生任务结果，每次只允许一个 ID。

GET
/tasks

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_ids（查询参数）	string	是	单个供应商任务 ID，例如 kling_task_example；不接受逗号分隔或重复 task_ids 参数。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/tasks?task_ids=kling_task_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "code": 0,
  "data": [
    {
      "task_id": "kling_task_example",
      "task_status": "succeed",
      "task_result": {
        "videos": [
          {
            "url": "https://media.example.com/output.mp4"
          }
        ]
      }
    }
  ]
}
使用说明
请求示例：GET /tasks?task_ids=kling_task_example。供应商结果可为数组或对象，原样返回。
查询始终使用创建账号和原任务协议，不广播查询其它账号；任务不存在或归属不匹配时返回 404。
本站没有注册 Kling DELETE /tasks；即使外部文档提供取消接口，也不能直接当成本平台能力。
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

400 · VIDEO_TASK_ID_REQUIRED

必须且只能提供一个 task_ids。

常见错误与排查
```

---

## 万相 / Wan · 创建原生任务

官网页面： https://www.codex2api.com/docs/wan-create

```text
视频与异步任务
Wan / 万相
Video
万相 / Wan · 创建原生任务
复制 MD

保留 input 与 parameters 嵌套结构，提交原生异步视频合成。

POST
/api/v1/services/aigc/video-generation/video-synthesis

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	当前分组已配置的 Wan 视频模型 ID。
input	object	是	厂商输入对象，例如 prompt、img_url、video_url；支持范围以当前模型为准。
input.prompt	string	条件必填	文本提示词，图生视频等操作是否必填由厂商决定。
parameters	object	条件必填	视频生成参数。本站优先读取此对象中的计费维度，不能用冲突的顶层字段覆盖。
parameters.duration	number	条件必填	生成时长（秒），按实际模型可选范围填写。
parameters.resolution / parameters.size	string	条件必填	分辨率按实际厂商字段填写，并确保与本站价卡匹配。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/api/v1/services/aigc/video-generation/video-synthesis" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "wan-video-model",
  "input": {
    "prompt": "山间湖泊，云雾缓慢漂移"
  },
  "parameters": {
    "duration": 5,
    "resolution": "720p"
  }
}'
JSON
复制
{
  "model": "wan-video-model",
  "input": {
    "prompt": "山间湖泊，云雾缓慢漂移"
  },
  "parameters": {
    "duration": 5,
    "resolution": "720p"
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "output": {
    "task_id": "wan_task_example",
    "task_status": "PENDING"
  },
  "request_id": "upstream_trace_example"
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
网关向上游创建请求添加 X-DashScope-Async: enable。调用方仍只需使用本站 Bearer Key。
output.task_id 才是任务 ID；顶层 request_id 是追踪编号，不可用来轮询。本站未开放 Wan 原生取消端点。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## 万相 / Wan · 查询原生任务

官网页面： https://www.codex2api.com/docs/wan-query

```text
视频与异步任务
Wan / 万相
Video
万相 / Wan · 查询原生任务
复制 MD

读取 output.task_status 和完成视频地址。

GET
/api/v1/tasks/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/api/v1/tasks/wan_task_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "output": {
    "task_id": "wan_task_example",
    "task_status": "SUCCEEDED",
    "video_url": "https://media.example.com/output.mp4"
  },
  "usage": {
    "duration": 5
  },
  "request_id": "upstream_trace_example"
}
使用说明
使用创建响应 output.task_id；典型状态 PENDING、RUNNING、SUCCEEDED、FAILED 以供应商响应为准。
此原生路径不同于 GET /v1/tasks/{id}；后者接收本站 vid_… ID 并返回统一任务对象。
供应商参数、结果和用量字段原样返回；账务可通过 X-Video-Task-ID 的统一查询或任务记录查看。
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## MiniMax · 创建原生视频任务

官网页面： https://www.codex2api.com/docs/minimax-video-create

```text
视频与异步任务
MiniMax
Video
MiniMax · 创建原生视频任务
复制 MD

按已配置 MiniMax 视频上游的 /v2 协议提交异步生成，不进入 MiniMax 文本分组。

POST
/v2/video_generation

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	当前 Video 分组允许且已有定价的模型 ID，例如管理员配置的 MiniMax-H3-Max。
content / prompt	array / string	条件必填	按实际 MiniMax 上游协议提供多模态 content 或 prompt；网关不转换两种表示。content 存在时参考视频与图片计数优先从该数组读取。
duration	number	条件必填	生成秒数，按模型限制填写，预扣预算读取该数字。
resolution	string	条件必填	如上游支持的 768p，必须与站内配置匹配；不会自动映射为 720p。
aigc_watermark / 其他字段	boolean / JSON	否	模型支持的水印或媒体扩展字段，原样转发。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v2/video_generation" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "MiniMax-H3-Max",
  "content": [
    {
      "type": "text",
      "text": "小猫在雪地里追逐雪花"
    }
  ],
  "duration": 8,
  "resolution": "768p",
  "aigc_watermark": false
}'
JSON
复制
{
  "model": "MiniMax-H3-Max",
  "content": [
    {
      "type": "text",
      "text": "小猫在雪地里追逐雪花"
    }
  ],
  "duration": 8,
  "resolution": "768p",
  "aigc_watermark": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "task_id": "minimax_task_example",
  "base_resp": {
    "status_code": 0,
    "status_msg": "success"
  }
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
这里记录本站已经注册的 /v2 协议，不承诺兼容任意 MiniMax 官方或第三方的其它版本路径。
本站没有注册该协议的原生取消或文件检索 API。任务完成后使用响应中可用的产物链接；需要统一下载时可用 X-Video-Task-ID 对应的 /v1/videos/{id}/content，前提是本站已取得可读取的视频地址并完成结算。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## MiniMax · 查询原生视频任务

官网页面： https://www.codex2api.com/docs/minimax-video-query

```text
视频与异步任务
MiniMax
Video
MiniMax · 查询原生视频任务
复制 MD

使用创建响应 task_id 查询生成状态，保留上游结果。

GET
/v2/query/video_generation/{task_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v2/query/video_generation/minimax_task_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

这是支持直接视频地址的上游响应示例；实际状态大小写、结果字段和 usage 由所接入上游决定。

JSON
复制
{
  "task_id": "minimax_task_example",
  "status": "Success",
  "data": {
    "video_url": "https://media.example.com/output.mp4"
  },
  "base_resp": {
    "status_code": 0,
    "status_msg": "success"
  }
}
使用说明
同时检查 HTTP 状态、base_resp 等业务错误和生成状态。HTTP 200 本身不代表生成成功。
若上游只提供私有 file_id，本站不会凭空合成下载链接；当前没有独立 MiniMax 文件下载网关接口，需管理员适配实际供应商的结果合同。
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## Vidu · 图生视频

官网页面： https://www.codex2api.com/docs/vidu-img2video

```text
视频与异步任务
Vidu
Video
Vidu · 图生视频
复制 MD

通过已配置可美视频适配的 Vidu 账号提交对应操作的异步任务。

POST
/ent/v2/img2video

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Video 分组可用且已有定价的模型 ID；例如已配置的 viduq3-pro。Q4 仅支持 img2video 和 reference2video。
prompt	string	否	视频内容描述，文生视频必须提供。
images	string[]	是	参考图片 URL 数组：img2video 恰好 1 张、reference2video 至少 1 张、start-end2video 恰好 2 张；text2video 不能带图。数量上限及文件限制遵循模型要求。
duration / resolution / aspect_ratio	integer / string / string	否	视频时长、分辨率与比例，默认 5 秒、540p、16:9；按模型支持范围填写，实际发送值参与价格与预算计算。
sounds	string[]	否	参考音频 URL 数组，是否支持由模型和操作决定。
audio / off_peak / seed	boolean / boolean / integer	否	是否生成音频、错峰模式及非负随机种子；具体能力由上游模型决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/ent/v2/img2video" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "images": [
    "https://media.example.com/first-frame.png"
  ],
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}'
JSON
复制
{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "images": [
    "https://media.example.com/first-frame.png"
  ],
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "task_id": "vidu_task_example",
  "type": "img2video",
  "state": "created",
  "model": "viduq3-pro",
  "duration": 5,
  "created_at": "2026-10-16T12:00:00Z"
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
Vidu 账号必须明确启用 Vidu 端点并选择“可美视频”协议。支持 image_urls→images、audios→sounds、ratio→aspect_ratio、generate_audio→audio 别名；同时传入同义字段时必须相同，否则请求被拒绝。
使用原生查询路径 GET /ent/v2/tasks/{task_id}/creations。本站未提供 Vidu 原生取消接口，不会将查询或失败自动转换为再次创建。
按秒模式预留预计视频费；按次模式预留一次成功任务费。Token 模式可按模型配置先用独立秒价预扣，也可完成后结算。最终按任务创建时冻结的价卡、实际用量和适用倍率结算；参考图片附加费为固定金额。
缺少价格会阻止提交，缺少可信 Token 用量会进入待核对，不能按零费用处理。完成、失败和退款请同时检查 status 与 billing_status。
创建完整收到 HTTP 4xx/5xx 且没有上游任务 ID 时，独立 Video 任务失败并释放预扣。新任务若创建超时且没有任务 ID 或持久响应证据，核对 15 分钟后按失败释放，不自动重发；提交进程中断且满足同样条件时按已保存的创建截止时间起算。已取得 ID、响应读取失败、冲突 ID、成功响应缺 ID 或缺少分类的旧任务仍需核对；查询错误不会自动退款。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Vidu · 参考生视频

官网页面： https://www.codex2api.com/docs/vidu-reference2video

```text
视频与异步任务
Vidu
Video
Vidu · 参考生视频
复制 MD

通过已配置可美视频适配的 Vidu 账号提交对应操作的异步任务。

POST
/ent/v2/reference2video

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Video 分组可用且已有定价的模型 ID；例如已配置的 viduq3-pro。Q4 仅支持 img2video 和 reference2video。
prompt	string	否	视频内容描述，文生视频必须提供。
images	string[]	是	参考图片 URL 数组：img2video 恰好 1 张、reference2video 至少 1 张、start-end2video 恰好 2 张；text2video 不能带图。数量上限及文件限制遵循模型要求。
duration / resolution / aspect_ratio	integer / string / string	否	视频时长、分辨率与比例，默认 5 秒、540p、16:9；按模型支持范围填写，实际发送值参与价格与预算计算。
sounds	string[]	否	参考音频 URL 数组，是否支持由模型和操作决定。
audio / off_peak / seed	boolean / boolean / integer	否	是否生成音频、错峰模式及非负随机种子；具体能力由上游模型决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/ent/v2/reference2video" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "images": [
    "https://media.example.com/reference.png"
  ],
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}'
JSON
复制
{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "images": [
    "https://media.example.com/reference.png"
  ],
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "task_id": "vidu_task_example",
  "type": "reference2video",
  "state": "created",
  "model": "viduq3-pro",
  "duration": 5,
  "created_at": "2026-10-16T12:00:00Z"
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
Vidu 账号必须明确启用 Vidu 端点并选择“可美视频”协议。支持 image_urls→images、audios→sounds、ratio→aspect_ratio、generate_audio→audio 别名；同时传入同义字段时必须相同，否则请求被拒绝。
使用原生查询路径 GET /ent/v2/tasks/{task_id}/creations。本站未提供 Vidu 原生取消接口，不会将查询或失败自动转换为再次创建。
按秒模式预留预计视频费；按次模式预留一次成功任务费。Token 模式可按模型配置先用独立秒价预扣，也可完成后结算。最终按任务创建时冻结的价卡、实际用量和适用倍率结算；参考图片附加费为固定金额。
缺少价格会阻止提交，缺少可信 Token 用量会进入待核对，不能按零费用处理。完成、失败和退款请同时检查 status 与 billing_status。
创建完整收到 HTTP 4xx/5xx 且没有上游任务 ID 时，独立 Video 任务失败并释放预扣。新任务若创建超时且没有任务 ID 或持久响应证据，核对 15 分钟后按失败释放，不自动重发；提交进程中断且满足同样条件时按已保存的创建截止时间起算。已取得 ID、响应读取失败、冲突 ID、成功响应缺 ID 或缺少分类的旧任务仍需核对；查询错误不会自动退款。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Vidu · 文生视频

官网页面： https://www.codex2api.com/docs/vidu-text2video

```text
视频与异步任务
Vidu
Video
Vidu · 文生视频
复制 MD

通过已配置可美视频适配的 Vidu 账号提交对应操作的异步任务。

POST
/ent/v2/text2video

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Video 分组可用且已有定价的模型 ID；例如已配置的 viduq3-pro。Q4 仅支持 img2video 和 reference2video。
prompt	string	是	视频内容描述，文生视频必须提供。
images	string[]	否	参考图片 URL 数组：img2video 恰好 1 张、reference2video 至少 1 张、start-end2video 恰好 2 张；text2video 不能带图。数量上限及文件限制遵循模型要求。
duration / resolution / aspect_ratio	integer / string / string	否	视频时长、分辨率与比例，默认 5 秒、540p、16:9；按模型支持范围填写，实际发送值参与价格与预算计算。
sounds	string[]	否	参考音频 URL 数组，是否支持由模型和操作决定。
audio / off_peak / seed	boolean / boolean / integer	否	是否生成音频、错峰模式及非负随机种子；具体能力由上游模型决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/ent/v2/text2video" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}'
JSON
复制
{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "task_id": "vidu_task_example",
  "type": "text2video",
  "state": "created",
  "model": "viduq3-pro",
  "duration": 5,
  "created_at": "2026-10-16T12:00:00Z"
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
Vidu 账号必须明确启用 Vidu 端点并选择“可美视频”协议。支持 image_urls→images、audios→sounds、ratio→aspect_ratio、generate_audio→audio 别名；同时传入同义字段时必须相同，否则请求被拒绝。
使用原生查询路径 GET /ent/v2/tasks/{task_id}/creations。本站未提供 Vidu 原生取消接口，不会将查询或失败自动转换为再次创建。
按秒模式预留预计视频费；按次模式预留一次成功任务费。Token 模式可按模型配置先用独立秒价预扣，也可完成后结算。最终按任务创建时冻结的价卡、实际用量和适用倍率结算；参考图片附加费为固定金额。
缺少价格会阻止提交，缺少可信 Token 用量会进入待核对，不能按零费用处理。完成、失败和退款请同时检查 status 与 billing_status。
创建完整收到 HTTP 4xx/5xx 且没有上游任务 ID 时，独立 Video 任务失败并释放预扣。新任务若创建超时且没有任务 ID 或持久响应证据，核对 15 分钟后按失败释放，不自动重发；提交进程中断且满足同样条件时按已保存的创建截止时间起算。已取得 ID、响应读取失败、冲突 ID、成功响应缺 ID 或缺少分类的旧任务仍需核对；查询错误不会自动退款。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Vidu · 首尾帧视频

官网页面： https://www.codex2api.com/docs/vidu-start-end2video

```text
视频与异步任务
Vidu
Video
Vidu · 首尾帧视频
复制 MD

通过已配置可美视频适配的 Vidu 账号提交对应操作的异步任务。

POST
/ent/v2/start-end2video

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Video 分组可用且已有定价的模型 ID；例如已配置的 viduq3-pro。Q4 仅支持 img2video 和 reference2video。
prompt	string	否	视频内容描述，文生视频必须提供。
images	string[]	是	参考图片 URL 数组：img2video 恰好 1 张、reference2video 至少 1 张、start-end2video 恰好 2 张；text2video 不能带图。数量上限及文件限制遵循模型要求。
duration / resolution / aspect_ratio	integer / string / string	否	视频时长、分辨率与比例，默认 5 秒、540p、16:9；按模型支持范围填写，实际发送值参与价格与预算计算。
sounds	string[]	否	参考音频 URL 数组，是否支持由模型和操作决定。
audio / off_peak / seed	boolean / boolean / integer	否	是否生成音频、错峰模式及非负随机种子；具体能力由上游模型决定。
Idempotency-Key（请求头）	string	否	仅独立 Video 任务支持，最多 128 字符。同一 Key、相同路径和完全相同的原始正文返回已有任务；正文空格或键顺序改变也会触发 409。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/ent/v2/start-end2video" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "images": [
    "https://media.example.com/first-frame.png",
    "https://media.example.com/last-frame.png"
  ],
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}'
JSON
复制
{
  "model": "viduq3-pro",
  "prompt": "镜头缓缓向前，展现安静的海岸线",
  "images": [
    "https://media.example.com/first-frame.png",
    "https://media.example.com/last-frame.png"
  ],
  "duration": 5,
  "resolution": "540p",
  "aspect_ratio": "16:9"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "task_id": "vidu_task_example",
  "type": "start-end2video",
  "state": "created",
  "model": "viduq3-pro",
  "duration": 5,
  "created_at": "2026-10-16T12:00:00Z"
}
使用说明
这是 Video 平台原生入口。需要绑定 Video 分组的站内 Key，账号还需启用相应端点。模型会按站内映射替换；原有协议保留厂商字段，显式协议适配按该方案支持的参数及别名处理。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
Vidu 账号必须明确启用 Vidu 端点并选择“可美视频”协议。支持 image_urls→images、audios→sounds、ratio→aspect_ratio、generate_audio→audio 别名；同时传入同义字段时必须相同，否则请求被拒绝。
使用原生查询路径 GET /ent/v2/tasks/{task_id}/creations。本站未提供 Vidu 原生取消接口，不会将查询或失败自动转换为再次创建。
按秒模式预留预计视频费；按次模式预留一次成功任务费。Token 模式可按模型配置先用独立秒价预扣，也可完成后结算。最终按任务创建时冻结的价卡、实际用量和适用倍率结算；参考图片附加费为固定金额。
缺少价格会阻止提交，缺少可信 Token 用量会进入待核对，不能按零费用处理。完成、失败和退款请同时检查 status 与 billing_status。
创建完整收到 HTTP 4xx/5xx 且没有上游任务 ID 时，独立 Video 任务失败并释放预扣。新任务若创建超时且没有任务 ID 或持久响应证据，核对 15 分钟后按失败释放，不自动重发；提交进程中断且满足同样条件时按已保存的创建截止时间起算。已取得 ID、响应读取失败、冲突 ID、成功响应缺 ID 或缺少分类的旧任务仍需核对；查询错误不会自动退款。
常见错误与排查
400 · VIDEO_MODEL_REQUIRED / VIDEO_MODEL_CONFLICT

缺少 model，或路径模型与正文 model 不一致。

400 · VIDEO_PRICING_UNAVAILABLE

模型或分辨率缺少匹配价卡与兜底价，生成不会继续。

400 · VIDEO_METADATA_CONFLICT

混用多个参数结构，分辨率、时长或参考媒体信息互相冲突。

400 · VIDEO_INVALID_OPENAI_PARAMETERS

OpenAI Videos 秒数、尺寸或参考图结构不合法，或不符合账号显式配置的 H3 参数要求。

400 · VIDEO_TASK_BUDGET_REQUIRED

按秒预留或 Token 秒价预扣需要时长；自动时长请求需由管理员配置任务时长预留上限。

409 · VIDEO_TASK_CONFLICT

幂等键对应了不同请求，或当前任务状态不允许该操作。

415 · VIDEO_CONTENT_TYPE

创建独立 Video 任务必须使用 application/json，不接受 multipart。

429 · VIDEO_TASK_LIMIT

账号在途任务数达到上限，请等待已有任务完成。

503 · VIDEO_NO_ELIGIBLE_ACCOUNT

没有同时满足模型、端点、分组和并发要求的视频账号。

4xx / 5xx · 上游错误

原生上游错误可能保留原 HTTP 状态和正文；请读取错误体及 X-Video-Task-ID。不要对受理不明的生成请求直接重试。

常见错误与排查
```

---

## Vidu · 查询视频任务

官网页面： https://www.codex2api.com/docs/vidu-query

```text
视频与异步任务
Vidu
Video
Vidu · 查询视频任务
复制 MD

使用创建响应 task_id 查询状态和视频产物。

GET
/ent/v2/tasks/{task_id}/creations

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
task_id / video_id（路径）	string	是	创建响应中的任务 ID。统一接口使用本站 vid_… ID；原生接口使用供应商 ID。必须使用创建任务的同一站内 API Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/ent/v2/tasks/vidu_task_example/creations" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "id": "vidu_task_example",
  "type": "img2video",
  "state": "success",
  "err_code": "",
  "err_msg": "",
  "creations": [
    {
      "id": "creation_example",
      "url": "https://media.example.com/output.mp4",
      "cover_url": "https://media.example.com/cover.jpg"
    }
  ]
}
使用说明
状态由上游返回，例如 created、queueing、processing、success、failed。读取 err_code、err_msg 判断失败原因；HTTP 200 不能单独证明生成成功。
原生响应保留上游格式和任务 ID；响应头 X-Video-Task-ID 提供本站 vid_… ID，可用于统一任务查询。示例字段由具体上游决定，不是固定面板响应包。
任务记录由后台持久轮询推进；生成完成不等于扣费已完成，统一查询中的 billing_status=settled 才表示已结算。查询和下载不会再次生成。
查询使用创建任务时的账号和冻结适配配置，不能跨 Key 读取任务。
常见错误与排查
404 · VIDEO_TASK_NOT_FOUND

任务不存在，或不属于当前用户、API Key、原生协议。

409 · VIDEO_TASK_CONFLICT

任务状态不允许操作，或原生任务 ID 对应多个归属，无法安全确定任务。

503 · VIDEO_ACCOUNT_BUSY

原任务账号当前繁忙，稍后查询；不会换账号查询或重新生成。

常见错误与排查
```

---

## Grok · 视频生成

官网页面： https://www.codex2api.com/docs/grok-video-create

```text
视频与异步任务
Grok / xAI
Grok
Grok · 视频生成
复制 MD

Grok / xAI 异步文生或图生视频，返回供应商任务 ID。

POST
/v1/videos/generations

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	分组可用的 Grok 视频模型，例如 grok-imagine-video-1.5。
prompt	string	是	视频内容描述，具体限制由上游模型决定。
duration / resolution / aspect_ratio	number / string / string	否	使用 xAI 支持的时长、分辨率与比例，不把统一 Video 的 ratio 字段直接视为同义。
image / images / reference_images	object / array	否	图生视频参考图，推荐使用 {url:"https://..."} 对象；历史 image_url 字段仍会规范化为 url。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/videos/generations" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "grok-imagine-video-1.5",
  "prompt": "海浪缓缓拍打沙滩",
  "duration": 8,
  "resolution": "720p",
  "aspect_ratio": "16:9"
}'
JSON
复制
{
  "model": "grok-imagine-video-1.5",
  "prompt": "海浪缓缓拍打沙滩",
  "duration": 8,
  "resolution": "720p",
  "aspect_ratio": "16:9"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

原生任务响应示例，实际 HTTP 状态及字段由上游返回。Grok 分组也可用 POST /v1/videos 或 /videos 创建。

JSON
复制
{
  "request_id": "grok_task_example"
}
使用说明
仅 Grok 分组可用，账号需具备视频生成资格；模型与参数必须被实际上游支持。与独立 Video 任务的 vid_… 状态及预扣规则不同。
Grok 创建只保存任务和计费信息；后续查询或 content 下载观察到 status=done 且存在 video.url 时才尝试结算。请主动轮询，任务记录列表本身不会查询上游或触发扣费。
必须用原 Key 查询，任务始终回到原账号。归属缓存保留约 24 小时，请及时获取结果；重复查询和下载使用任务幂等结算，不新增生成费用。
兼容路径
/videos/generations
常见错误与排查
400 · invalid_request_error

请求体、模型或上游视频参数无效。

404 · 任务不可用

任务不存在、归属不匹配，或原任务绑定已过期。

503 · grok_media_no_eligible_account

没有具备媒体资格且可承接请求的 Grok 账号。

4xx / 5xx · 上游错误

查看原错误内容；创建结果不确定时先核对任务，不要盲目重复生成。

常见错误与排查
```

---

## Grok · 视频编辑

官网页面： https://www.codex2api.com/docs/grok-video-edit

```text
视频与异步任务
Grok / xAI
Grok
Grok · 视频编辑
复制 MD

向支持该操作的 Grok 上游提交原生异步视频请求。

POST
/v1/videos/edits

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	上游允许编辑或扩展的 Grok 视频模型。
prompt	string	条件必填	描述编辑效果或新增视频内容，是否必填取决于上游。
video	object	是	按 xAI 实际模型协议提供原视频对象，例如 {url:"https://..."}；视频必须能被上游读取。
duration / 其他参数	number / JSON	否	支持范围与字段遵循实际 Grok 操作，网关不把编辑和扩展转换为普通生成。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/videos/edits" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "grok-imagine-video-1.5",
  "prompt": "将视频调整为温暖的夕阳光线",
  "video": {
    "url": "https://media.example.com/input.mp4"
  }
}'
JSON
复制
{
  "model": "grok-imagine-video-1.5",
  "prompt": "将视频调整为温暖的夕阳光线",
  "video": {
    "url": "https://media.example.com/input.mp4"
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "request_id": "grok_task_example"
}
使用说明
仅 Grok 分组可用，账号需具备视频生成资格；模型与参数必须被实际上游支持。与独立 Video 任务的 vid_… 状态及预扣规则不同。
Grok 创建只保存任务和计费信息；后续查询或 content 下载观察到 status=done 且存在 video.url 时才尝试结算。请主动轮询，任务记录列表本身不会查询上游或触发扣费。
必须用原 Key 查询，任务始终回到原账号。归属缓存保留约 24 小时，请及时获取结果；重复查询和下载使用任务幂等结算，不新增生成费用。
查询可使用相应操作路径 /{request_id} 或 /v1/videos/{request_id}，内容下载在其后追加 /content。
兼容路径
/videos/edits
常见错误与排查
400 · invalid_request_error

请求体、模型或上游视频参数无效。

404 · 任务不可用

任务不存在、归属不匹配，或原任务绑定已过期。

503 · grok_media_no_eligible_account

没有具备媒体资格且可承接请求的 Grok 账号。

4xx / 5xx · 上游错误

查看原错误内容；创建结果不确定时先核对任务，不要盲目重复生成。

常见错误与排查
```

---

## Grok · 视频扩展

官网页面： https://www.codex2api.com/docs/grok-video-extend

```text
视频与异步任务
Grok / xAI
Grok
Grok · 视频扩展
复制 MD

向支持该操作的 Grok 上游提交原生异步视频请求。

POST
/v1/videos/extensions

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	上游允许编辑或扩展的 Grok 视频模型。
prompt	string	条件必填	描述编辑效果或新增视频内容，是否必填取决于上游。
video	object	是	按 xAI 实际模型协议提供原视频对象，例如 {url:"https://..."}；视频必须能被上游读取。
duration / 其他参数	number / JSON	否	支持范围与字段遵循实际 Grok 操作，网关不把编辑和扩展转换为普通生成。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/videos/extensions" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "grok-imagine-video-1.5",
  "prompt": "继续向前移动镜头，展现海岸线",
  "video": {
    "url": "https://media.example.com/input.mp4"
  }
}'
JSON
复制
{
  "model": "grok-imagine-video-1.5",
  "prompt": "继续向前移动镜头，展现海岸线",
  "video": {
    "url": "https://media.example.com/input.mp4"
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "request_id": "grok_task_example"
}
使用说明
仅 Grok 分组可用，账号需具备视频生成资格；模型与参数必须被实际上游支持。与独立 Video 任务的 vid_… 状态及预扣规则不同。
Grok 创建只保存任务和计费信息；后续查询或 content 下载观察到 status=done 且存在 video.url 时才尝试结算。请主动轮询，任务记录列表本身不会查询上游或触发扣费。
必须用原 Key 查询，任务始终回到原账号。归属缓存保留约 24 小时，请及时获取结果；重复查询和下载使用任务幂等结算，不新增生成费用。
查询可使用相应操作路径 /{request_id} 或 /v1/videos/{request_id}，内容下载在其后追加 /content。
兼容路径
/videos/extensions
常见错误与排查
400 · invalid_request_error

请求体、模型或上游视频参数无效。

404 · 任务不可用

任务不存在、归属不匹配，或原任务绑定已过期。

503 · grok_media_no_eligible_account

没有具备媒体资格且可承接请求的 Grok 账号。

4xx / 5xx · 上游错误

查看原错误内容；创建结果不确定时先核对任务，不要盲目重复生成。

常见错误与排查
```

---

## Grok · 查询生成、编辑或扩展任务

官网页面： https://www.codex2api.com/docs/grok-video-query

```text
视频与异步任务
Grok / xAI
Grok
Grok · 查询生成、编辑或扩展任务
复制 MD

保持原账号归属，查询原生 xAI 视频状态；首次成功结果可触发结算。

GET
/v1/videos/generations/{request_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
request_id（路径）	string	是	创建响应中的供应商 request_id/id/task_id，继续使用原 Key。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/videos/generations/grok_task_example" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "status": "done",
  "model": "grok-imagine-video-1.5",
  "video": {
    "url": "https://media.example.com/output.mp4",
    "duration": 8
  }
}
使用说明
也支持共享 GET /v1/videos/{request_id} 和 /videos/{request_id}。典型 pending → done；真实状态与错误按上游返回。
Grok 创建只保存任务和计费信息；后续查询或 content 下载观察到 status=done 且存在 video.url 时才尝试结算。请主动轮询，任务记录列表本身不会查询上游或触发扣费。
必须用原 Key 查询，任务始终回到原账号。归属缓存保留约 24 小时，请及时获取结果；重复查询和下载使用任务幂等结算，不新增生成费用。
兼容路径
/videos/generations/{request_id}
/v1/videos/edits/{request_id}
/videos/edits/{request_id}
/v1/videos/extensions/{request_id}
/videos/extensions/{request_id}
常见错误与排查
400 · invalid_request_error

请求体、模型或上游视频参数无效。

404 · 任务不可用

任务不存在、归属不匹配，或原任务绑定已过期。

503 · grok_media_no_eligible_account

没有具备媒体资格且可承接请求的 Grok 账号。

4xx / 5xx · 上游错误

查看原错误内容；创建结果不确定时先核对任务，不要盲目重复生成。

常见错误与排查
```

---

## Grok · 获取生成、编辑或扩展内容

官网页面： https://www.codex2api.com/docs/grok-video-content

```text
视频与异步任务
Grok / xAI
Grok
Grok · 获取生成、编辑或扩展内容
复制 MD

通过原任务账号代理视频文件，支持 Range；首次观察到成功时可能完成结算。

GET
/v1/videos/generations/{request_id}/content

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
request_id（路径）	string	是	供应商任务 ID。
Range（请求头）	string	否	可选字节范围，例如 bytes=0-1048575。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/videos/generations/grok_task_example/content" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 200 OK
Content-Type: video/mp4

<视频二进制内容>
使用说明
也可使用共享 /v1/videos/{request_id}/content 或 /videos/{request_id}/content。返回媒体流，不是 JSON。
接口会先确认原任务状态，再代理视频内容；上游凭据不会暴露给调用方。链接过期或任务绑定失效时可能无法下载，请及时保存产物。
兼容路径
/videos/generations/{request_id}/content
/v1/videos/edits/{request_id}/content
/videos/edits/{request_id}/content
/v1/videos/extensions/{request_id}/content
/videos/extensions/{request_id}/content
常见错误与排查
400 · invalid_request_error

请求体、模型或上游视频参数无效。

404 · 任务不可用

任务不存在、归属不匹配，或原任务绑定已过期。

503 · grok_media_no_eligible_account

没有具备媒体资格且可承接请求的 Grok 账号。

4xx / 5xx · 上游错误

查看原错误内容；创建结果不确定时先核对任务，不要盲目重复生成。

常见错误与排查
```

---

## Grok 文字转语音

官网页面： https://www.codex2api.com/docs/grok-tts

```text
语音与实时会话
Grok
Grok 文字转语音
复制 MD

将文本转换为音频，直接返回音频字节。

POST
/v1/tts

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
text	string	是	Body：朗读文本。
voice_id	string	否	Body：上游内置声音或已创建的自定义声音 ID。
language	string	否	Body：上游支持的语言代码，例如 en。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/tts" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "text": "Hello from TokenRouter.",
  "voice_id": "Ara",
  "language": "en"
}'
JSON
复制
{
  "text": "Hello from TokenRouter.",
  "voice_id": "Ara",
  "language": "en"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 200 OK
Content-Type: audio/mpeg

<音频二进制>
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
TTS 根据实际请求文本字符数和分组语音价结算，不按普通聊天 Token 价格计算。
兼容路径
/tts
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## Grok 语音转文字

官网页面： https://www.codex2api.com/docs/grok-stt

```text
语音与实时会话
Grok
Grok 语音转文字
复制 MD

上传音频，返回原生转录 JSON。

POST
/v1/stt

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: multipart/form-data

参数	类型	必填	说明
file	file	是	Multipart Form：待转录的音频文件。
model	string	否	Multipart Form：转录模型，项目连通性测试使用 grok-stt。
language	string	否	Multipart Form：上游支持的语言代码。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl "$BASE_URL/v1/stt" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -F "file=@speech.wav" \
  -F "model=grok-stt" \
  -F "language=en"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

响应保持上游转录结构，可能包含语言、时长等额外字段。

JSON
复制
{
  "text": "Hello from TokenRouter."
}
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
STT 按可识别音频时长和分组语音价结算。
兼容路径
/stt
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## 创建自定义声音

官网页面： https://www.codex2api.com/docs/grok-voice-create

```text
语音与实时会话
Grok
创建自定义声音
复制 MD

将参考录音提交到所选 Grok 上游创建声音。

POST
/v1/custom-voices

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: multipart/form-data

参数	类型	必填	说明
file	file	是	Multipart Form：声音参考录音。
name	string	否	Multipart Form：声音名称。
language / gender / tone / use_case	string	否	Multipart Form：上游支持的声音元数据。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl "$BASE_URL/v1/custom-voices" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -F "file=@reference.wav" \
  -F "name=My Narrator" \
  -F "language=en"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "voice_id": "abc123xy",
  "name": "My Narrator",
  "created_at": "2026-10-01T00:00:00Z"
}
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
网关开放路由不代表上游账号已开通声音创建权限；创建能力与素材要求由上游控制。
兼容路径
/custom-voices
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## 列出自定义声音

官网页面： https://www.codex2api.com/docs/grok-voice-list

```text
语音与实时会话
Grok
列出自定义声音
复制 MD

读取当前调度到的 Grok 上游账号中的声音列表。

GET
/v1/custom-voices

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

此接口没有额外请求体；路径及查询参数以接口说明为准。

请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/custom-voices" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "voices": [
    {
      "voice_id": "abc123xy",
      "name": "My Narrator"
    }
  ],
  "pagination_token": null
}
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
当前代理没有转发声音列表的查询参数；不要依赖分页参数被传到上游。列表结构保持上游格式。
兼容路径
/custom-voices
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## 查询自定义声音

官网页面： https://www.codex2api.com/docs/grok-voice-get

```text
语音与实时会话
Grok
查询自定义声音
复制 MD

获取指定声音元数据。

GET
/v1/custom-voices/{voice_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
voice_id	string	是	Path：上游返回的自定义声音 ID；示例 abc123xy 需要替换为真实值。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1/custom-voices/abc123xy" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "voice_id": "abc123xy",
  "name": "My Narrator",
  "language": "en"
}
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
兼容路径
/custom-voices/{voice_id}
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## 更新自定义声音

官网页面： https://www.codex2api.com/docs/grok-voice-update

```text
语音与实时会话
Grok
更新自定义声音
复制 MD

修改声音的上游元数据。

PATCH
/v1/custom-voices/{voice_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
voice_id	string	是	Path：上游返回的自定义声音 ID；示例 abc123xy 需要替换为真实值。
name / description / tone	string	否	Body：需要更新的声音元数据；可用字段以实际上游为准。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X PATCH "$BASE_URL/v1/custom-voices/abc123xy" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "description": "用于简短旁白",
  "tone": "calm"
}'
JSON
复制
{
  "description": "用于简短旁白",
  "tone": "calm"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "voice_id": "abc123xy",
  "name": "My Narrator",
  "description": "用于简短旁白",
  "tone": "calm"
}
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
兼容路径
/custom-voices/{voice_id}
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## 删除自定义声音

官网页面： https://www.codex2api.com/docs/grok-voice-delete

```text
语音与实时会话
Grok
删除自定义声音
复制 MD

从当前上游账号删除声音资源。

DELETE
/v1/custom-voices/{voice_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
voice_id	string	是	Path：上游返回的自定义声音 ID；示例 abc123xy 需要替换为真实值。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X DELETE "$BASE_URL/v1/custom-voices/abc123xy" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
成功响应的状态码和响应体按上游原样返回；没有本站统一删除对象。
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
删除后使用该声音的语音请求可能失败。
兼容路径
/custom-voices/{voice_id}
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## 下载自定义声音音频

官网页面： https://www.codex2api.com/docs/grok-voice-audio

```text
语音与实时会话
Grok
下载自定义声音音频
复制 MD

获取声音资源的上游音频内容。

GET
/v1/custom-voices/{voice_id}/audio

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
voice_id	string	是	Path：上游返回的自定义声音 ID；示例 abc123xy 需要替换为真实值。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl "$BASE_URL/v1/custom-voices/abc123xy/audio" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  --output voice-audio.bin
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 200 OK
Content-Type: audio/wav

<上游返回的音频二进制>
使用说明
仅 Grok 分组支持。请求方法、Content-Type、请求体和上游响应原样中继，具体可用字段由上游账号能力决定。
自定义声音资源属于上游账号；当前接口不为 voice_id 固定调度账号。需要稳定访问同一声音时，应使用绑定同一上游账号的分组。
未注册 /v1/audio/speech、/v1/audio/transcriptions、/v1/audio/translations、/v1/tts/voices 或流式 TTS WebSocket 别名。
Content-Type 以实际响应为准，不保证统一 WAV。
兼容路径
/custom-voices/{voice_id}/audio
常见错误与排查
404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

常见错误与排查
```

---

## Grok 实时语音 WebSocket

官网页面： https://www.codex2api.com/docs/grok-realtime

```text
语音与实时会话
Grok
Grok 实时语音 WebSocket
复制 MD

建立 xAI Voice 实时会话并双向转发音频事件。

WS
/v1/realtime

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
model	string	否	Query：默认 grok-voice-latest。
Upgrade / Connection	string	是	Header：由 WebSocket 客户端生成升级请求；使用可设置 Authorization 请求头的客户端。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
WebSocket
复制
wss://YOUR_GATEWAY_HOST/v1/realtime?model=grok-voice-latest
Authorization: Bearer $TOKENROUTER_API_KEY

{
  "type": "input_audio_buffer.append",
  "audio": "<按上游协商格式编码的 Base64 音频>"
}
响应示例 HTTP 101

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade

<后续为 xAI 原生双向 WebSocket 事件>
使用说明
示例 JSON 是升级后的事件，不是 HTTP 请求体。音频格式和 session 配置遵循实际 xAI Voice 协议。
仅 Grok 分组；会话期间持有并发槽。观测到真实音频后按连接时长结算，纯文本、仅转录事件或握手失败不计语音会话费。
此端点不是 Responses WebSocket，也不提供 OpenAI /v1/realtime 会话转换。
兼容路径
/realtime
常见错误与排查
426 · invalid_request_error

未使用 WebSocket 升级。

404 · not_found_error

非 Grok 分组，或声音资源在当前上游账号下不存在。

400 / 403 · 上游错误

参数不支持或上游账号未获相应语音/自定义声音能力。

503 · api_error

没有可用的 Grok 账号。

502 · upstream_error

上游实时握手失败。

常见错误与排查
```

---

## OpenAI Live 创建会话

官网页面： https://www.codex2api.com/docs/openai-live

```text
语音与实时会话
OpenAI
OpenAI Live 创建会话
复制 MD

创建 ChatGPT Live WebRTC 会话，返回 SDP answer 与控制通道地址。

POST
/v1/live

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json 或 multipart/form-data

参数	类型	必填	说明
sdp	string	是	Body 或 Multipart Form：WebRTC 客户端实际生成的 SDP offer，不能为空。
session	object	是	JSON Body：会话对象；multipart 时传 JSON 字符串。可包含 model 和工具等原生配置。
session.model	string	否	Body：默认 gpt-live，受 Key、渠道和账号模型映射及能力约束。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl "$BASE_URL/v1/live" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -F "sdp=<offer.sdp" \
  -F 'session={"model":"gpt-live"}'
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 200 OK
Content-Type: application/sdp
Location: /v1/live/call_example

<上游 SDP answer，交给 WebRTC 客户端设置远端描述>
使用说明
需要 OpenAI 分组开启 Live，并有可用 Live 账号。普通聊天账号或开启 Responses 不代表 Live 一定可用。
使用返回 Location 连接控制 WebSocket；Codex 别名创建时 Location 为 /backend-api/codex/{call_id}。此响应不是 JSON。
兼容路径
/backend-api/codex/realtime/calls
常见错误与排查
400 · invalid_request_error

SDP 为空或 session 不是合法 JSON 对象。

403 · permission_error

分组 Live 未启用或客户端不符合账号策略。

429 · rate_limit_error

Live 并发达到上限。

503 · api_error

没有可用 Live 账号或依赖服务暂不可用。

常见错误与排查
```

---

## OpenAI Live 控制通道

官网页面： https://www.codex2api.com/docs/openai-live-sideband

```text
语音与实时会话
OpenAI
OpenAI Live 控制通道
复制 MD

连接已有 Live 会话的 sideband WebSocket。

WS
/v1/live/{call_id}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
call_id	string	是	Path：创建会话响应 Location 中的 ID；必须使用相同 Key、用户/团队和分组身份。
Upgrade / Connection	string	是	Header：WebSocket 升级头，由客户端自动生成。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

WebSocket
复制
wss://YOUR_GATEWAY_HOST/v1/live/call_example
Authorization: Bearer $TOKENROUTER_API_KEY


响应示例 HTTP 101

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

text
复制
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade

<Live 控制事件流>
使用说明
使用创建接口实际返回的 Location，不要把任意 Codex 子路径当作 call_id。会话控制事件按 Live 原生协议转发。
兼容路径
/backend-api/codex/{call_id}
常见错误与排查
403 · permission_error

Live 未启用或会话属于其他身份。

404 · not_found_error

会话不存在或已不可用。

常见错误与排查
```

---

## Messages 输入 Token 统计

官网页面： https://www.codex2api.com/docs/messages-count-tokens

```text
搜索与扩展
Anthropic
OpenAI
Gemini
Grok
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Messages 输入 Token 统计
复制 MD

使用 Messages 请求格式预估输入 Token，不生成回复；部分平台返回本地估算值。

POST
/v1/messages/count_tokens

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-api-key: $TOKENROUTER_API_KEY
anthropic-version: 2023-06-01
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
messages	array	是	Body · 对话历史，元素包含 role（user / assistant）和 content（字符串或内容块数组）；工具结果使用 tool_result 内容块。
system	string | array	否	Body · 系统指令；内容块可携带供应商支持的缓存标记。
tools / tool_choice	array / object	否	Body · 工具声明使用 name、description、input_schema；工具是否可用由目标模型决定。客户端执行工具后继续提交 tool_result。
anthropic-version / anthropic-beta	string	否	Header · 原生 Anthropic 版本和可选能力声明，例如 anthropic-version: 2023-06-01；并非所有上游都支持相同 beta。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/messages/count_tokens" \
  -H "x-api-key: $TOKENROUTER_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "claude-sonnet-4",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}'
JSON
复制
{
  "model": "claude-sonnet-4",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "input_tokens": 12
}
使用说明
Antigravity、Qoder 和 Anthropic Bedrock 不支持此计数接口。/antigravity/v1/messages/count_tokens 虽保留路由，但明确返回 404。
Grok、OpenCode 和国产兼容平台可采用本地估算；OpenAI 可能桥接 Responses input_tokens 或回退估算。计数结果不应当作最终收费账单。
按平台执行 Messages 协议准入、权限与额度检查；客户端应保留本地估算回退。
兼容路径
/messages/count_tokens
常见错误与排查
404 · not_found_error

当前平台或账号类型不支持该接口。

400 · invalid_request_error

缺少 model 或消息结构无效。

常见错误与排查
```

---

## Responses 输入 Token 统计

官网页面： https://www.codex2api.com/docs/responses-input-tokens

```text
搜索与扩展
OpenAI
Grok
Kimi
Zhipu
DeepSeek
MiniMax
OpenCode Zen / GO
Cline
Command Code
Responses 输入 Token 统计
复制 MD

使用 Responses 请求体统计输入 Token；不能执行此预检的兼容账号会使用本地估算。

POST
/v1/responses/input_tokens

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
input	string | array	是	Body · 用户输入或完整历史项数组。消息内容支持 input_text；图片、工具调用及工具结果的支持范围取决于上游。
instructions	string	否	Body · 本轮系统指令。继续对话时请按客户端协议重新提供需要保留的指令。
tools / tool_choice / parallel_tool_calls	array / string | object / boolean	否	Body · 函数工具示例：{type:"function", name:"lookup", parameters:{type:"object",properties:{}}}。函数执行在客户端，托管工具还需模型和账号支持。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/responses/input_tokens" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-6-astra",
  "input": "你好"
}'
JSON
复制
{
  "model": "gpt-6-astra",
  "input": "你好"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "object": "response.input_tokens",
  "input_tokens": 12
}
使用说明
只做输入预检，不生成回复、不记录生成用量；仍执行认证、分组协议、模型和扣费资格检查。
计数可能为本地近似值，不应视为实际收费。最终用量以真正生成请求的 usage 和本站记录为准。
Anthropic、Gemini、Antigravity、Qoder 分组不支持这个 Responses 子端点。
兼容路径
/responses/input_tokens
/backend-api/codex/responses/input_tokens
常见错误与排查
404 · not_found_error

当前平台不支持 Responses 输入计数。

502 · upstream_error

上游响应缺少有效 input_tokens 或请求失败且无法回退。

常见错误与排查
```

---

## Gemini 原生 Token 统计

官网页面： https://www.codex2api.com/docs/gemini-count-tokens

```text
搜索与扩展
Gemini
Antigravity
Gemini 原生 Token 统计
复制 MD

通过 countTokens 动作预检 Gemini 输入；Antigravity 当前仅提供零值兼容响应，不提供真实计数。

POST
/v1beta/models/{model}:countTokens

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Path · 模型名称，不在 Body 中重复 model；使用目录中 models/ 后的名称。
contents	array	是	Body · 待统计的 Gemini contents / parts。其他计数参数遵循上游支持的 countTokens 格式。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1beta/models/{model}:countTokens" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "你好"
        }
      ]
    }
  ]
}'
JSON
复制
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "你好"
        }
      ]
    }
  ]
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例为支持真实计数的 Gemini 路径。选到 Antigravity 账号时固定返回 {"totalTokens":0}，这是兼容占位，不能表示输入没有 Token。

JSON
复制
{
  "totalTokens": 3
}
使用说明
这里是 Gemini 原生动作，与不支持 Antigravity 的 /messages/count_tokens 不是同一接口。
Antigravity countTokens 不请求上游、不统计输入，只返回 totalTokens:0；专用 Antigravity 路径以及 Gemini 混合调度选到 Antigravity 时都适用，客户端应自行估算。
Gemini 原生账号的精确计数和回退行为取决于账号及上游支持；仍受 Gemini 协议门禁和鉴权约束，预检值不能替代最终用量和扣费。
兼容路径
/v1beta/models/{model}/countTokens
/antigravity/v1beta/models/{model}:countTokens
/antigravity/v1beta/models/{model}/countTokens
常见错误与排查
400 · INVALID_ARGUMENT

计数请求格式或模型名错误。

404 · NOT_FOUND

目标账号上游不支持此动作。

常见错误与排查
```

---

## TypeSafe / Jev System One

官网页面： https://www.codex2api.com/docs/opencode-systemone

```text
搜索与扩展
OpenCode Zen / GO
TypeSafe
TypeSafe / Jev System One
复制 MD

TypeSafe 或 OpenCode Zen Jev 的同步结构化决策接口，使用 state 和 questions，保持原生结果。

POST
/v1/systemone

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · TypeSafe 分组使用 jev-latest；OpenCode Zen 分组使用 jev-1.13 或 jev-1.13-free；GO 账号不支持。
state	JSON 值	是	Body · 必须提供待判断的状态内容，具体数据结构遵循 System One 上游规范。
questions	object	是	Body · 非空问题对象，键为问题 ID；type 支持 noul、choice、score；choice 的 criteria 为对象，score 为非空档位数组。重复键、大小写混淆与非法结构会在请求前拒绝。
stream	boolean	否	Body · 只允许 false 或省略；不支持流式。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/systemone" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "jev-1.13",
  "state": "classify",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "Is this urgent?"
    }
  }
}'
JSON
复制
{
  "model": "jev-1.13",
  "state": "classify",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "Is this urgent?"
    }
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "model": "jev-1.13",
  "answers": {
    "is_urgent": {
      "type": "noul",
      "value": false
    }
  },
  "usage": {
    "input_tokens": 12,
    "output_tokens": 1
  }
}
使用说明
问题示例用于展示结构，完整问题类型由上游校验。不能把 Messages / Chat / Responses 请求体直接发送到这里。
不支持图片、音频、视频；网关依据真实 usage 记录计费，并按账号规则派生缓存会话头。
兼容路径
/systemone
常见错误与排查
400 · invalid_request_error

模型、state、questions 不合法，或 stream=true。

404 · not_found_error

当前分组不是 TypeSafe / OpenCode，或没有可用的 System One 账号。

常见错误与排查
```

---

## Codex Alpha Search

官网页面： https://www.codex2api.com/docs/alpha-search

```text
搜索与扩展
OpenAI
Codex Alpha Search
复制 MD

OpenAI / Codex Responses Lite 使用的独立搜索接口，不是普通 Chat 或 Responses 请求体。

POST
/v1/alpha/search

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 当前 Key 可请求的模型 ID。请以模型目录为准；示例型号不代表本站一定已开通。
id	string	否	Body · 客户端搜索会话 ID。
commands	object	条件必填	Body · Codex 搜索命令，例如 {search_query:[{q:"查询内容"}]}；具体命令由上游支持的 SearchRequest 协议决定。
input / settings / reasoning	array / object / object	否	Body · Codex 原生上下文、搜索配置与思考参数，按客户端和上游协议提供，不保证所有兼容中继支持。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/alpha/search" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "gpt-6-astra",
  "id": "search-session-example",
  "commands": {
    "search_query": [
      {
        "q": "公开技术文档"
      }
    ]
  },
  "settings": {
    "external_web_access": true
  }
}'
JSON
复制
{
  "model": "gpt-6-astra",
  "id": "search-session-example",
  "commands": {
    "search_query": [
      {
        "q": "公开技术文档"
      }
    ]
  },
  "settings": {
    "external_web_access": true
  }
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例为 Responses 搜索兼容回退结果的关键结构。原生 Alpha Search 成功响应按上游 JSON 保留，不能假定所有上游字段完全相同。

JSON
复制
{
  "output": "搜索结果摘要。",
  "results": [
    {
      "type": "text_result",
      "ref_id": "turn0search0",
      "url": "https://example.com/docs",
      "title": "文档"
    }
  ]
}
使用说明
仅 OpenAI 分组且账号具备 Alpha Search 能力；普通模型可用不等于独立搜索端点可用。
特定 OAuth / PAT 场景可使用既有 Responses 搜索回退；不能将该能力视为任意第三方 API Key 均支持。
兼容路径
/alpha/search
/backend-api/codex/alpha/search
常见错误与排查
400 · invalid_request_error

缺少 model 或请求不是有效 JSON。

404 · not_found_error

非 OpenAI 分组或目标上游没有此工具接口。

503 · api_error

没有满足独立搜索能力的账号。

常见错误与排查
```

---

## Gemini 创建显式缓存

官网页面： https://www.codex2api.com/docs/gemini-cache-create

```text
搜索与扩展
Gemini
Gemini 创建显式缓存
复制 MD

先缓存长文本或多模态上下文，再在 Gemini 原生生成请求中通过 cachedContent 引用。

POST
/v1beta/cachedContents

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
model	string	是	Body · 缓存使用的 Gemini 模型，例如 models/gemini-2.5-flash；后续生成必须使用同一模型。
contents	array	是	Body · 待缓存内容，元素使用 Gemini role / parts 结构。文本、文件和最小 Token 数要求由目标模型与上游决定。
systemInstruction / tools / toolConfig	object / array / object	否	Body · 需要一同缓存的系统指令、工具声明和配置；按上游模型支持范围提供。
displayName	string	否	Body · 自定义展示名称，最多 128 个字符。
ttl	string	否	Body · 有效期，例如 3600s，必须大于 0；与 expireTime 二选一。均省略时通常为 3600 秒，且不超过站点和账号允许的上限。
expireTime	string	否	Body · RFC 3339 格式的未来到期时间，与 ttl 二选一；最长有效期受站点及账号限制。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1beta/cachedContents" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "model": "models/gemini-2.5-flash",
  "displayName": "产品手册",
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "请替换为需要重复使用的完整长文档，并满足目标模型的最小缓存 Token 数要求。"
        }
      ]
    }
  ],
  "ttl": "3600s"
}'
JSON
复制
{
  "model": "models/gemini-2.5-flash",
  "displayName": "产品手册",
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "请替换为需要重复使用的完整长文档，并满足目标模型的最小缓存 Token 数要求。"
        }
      ]
    }
  ],
  "ttl": "3600s"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

示例仅展示结构与占位用量。保存返回的 name 和 expireTime；name 是本站缓存资源名，不是上游账号资源名。

JSON
复制
{
  "name": "cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl",
  "model": "models/gemini-2.5-flash",
  "displayName": "产品手册",
  "usageMetadata": {
    "totalTokenCount": 32768
  },
  "createTime": "2026-10-13T08:00:00Z",
  "updateTime": "2026-10-13T08:00:00Z",
  "expireTime": "2026-10-13T09:00:00Z"
}
使用说明
仅支持绑定固定 Gemini 分组的站内 API Key；不支持复合 Key、智能路由 Key、Antigravity 专用入口或其他平台分组。团队 Key 仍须通过团队身份、成员资格和分组权限检查，产生费用的操作还受团队及成员额度限制。
账号必须支持显式缓存：官方 Gemini API Key、启用显式缓存的第三方 Gemini API Key，或 Vertex Service Account JSON 账号。OAuth 账号和 Vertex API Key 账号不支持。
缓存按创建时的 API Key 和分组隔离，即使同一用户也不能换另一把 Key 使用。查询、续期、删除和生成引用必须使用原 Key、原分组与本站返回的 name；不要填写上游账号的缓存 ID。
创建会收取实际缓存 Token 的输入费用，并按上游确认且不超过请求上限的实际有效期收取存储费用。存储用量按 Token × 小时计算，单价、分组和订阅倍率沿用本站计费设置；缺少输入或存储报价时，会在请求上游前拒绝创建。上游返回已过期的缓存会被清理并拒绝交付。
缺少足够长的内容、上游不支持缓存、TTL 超限均可能失败。示例中的短占位文本应替换为实际长内容。创建不是自动幂等操作，请勿在结果不明确时盲目重复提交。
创建和延长需要分组允许 Gemini GenerateContent 协议，并通过站内余额、订阅、Key 配额及并发检查。
常见错误与排查
400 · INVALID_ARGUMENT

Key 类型、分组、请求格式、TTL 或模型不支持；创建要求有可用的输入及缓存存储报价，延长要求有缓存存储报价。

403 · PERMISSION_DENIED

缓存不存在、已过期或不属于当前 Key / 分组时统一返回 CachedContent not found (or permission denied)；创建、续期或生成也可能因协议或额度权限被拒绝。

503 · UNAVAILABLE

没有支持显式缓存的可用账号，或持有缓存的账号暂不可用；不会将同一缓存切换到另一账号。

429 · RESOURCE_EXHAUSTED

并发、速率或上游额度达到限制，请降低并发后重试。

常见错误与排查
```

---

## Gemini 显式缓存列表

官网页面： https://www.codex2api.com/docs/gemini-cache-list

```text
搜索与扩展
Gemini
Gemini 显式缓存列表
复制 MD

分页查询当前 Key 在当前分组下尚未过期的本站缓存。

GET
/v1beta/cachedContents

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
pageSize	integer	否	Query · 默认 50；0 使用默认值，最多 1000，负数或非整数会被拒绝。
pageToken	string	否	Query · 使用上一页返回的 nextPageToken；不要自行构造。未返回 nextPageToken 表示没有下一页。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1beta/cachedContents?pageSize=50" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

按创建顺序倒序分页。没有记录时可返回 {}，客户端应将缺省 cachedContents 视为空数组；nextPageToken 仅在有下一页时出现。

JSON
复制
{
  "cachedContents": [
    {
      "name": "cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl",
      "model": "models/gemini-2.5-flash",
      "displayName": "产品手册",
      "usageMetadata": {
        "totalTokenCount": 32768
      },
      "createTime": "2026-10-13T08:00:00Z",
      "updateTime": "2026-10-13T08:00:00Z",
      "expireTime": "2026-10-13T09:00:00Z"
    }
  ],
  "nextPageToken": "MTIz"
}
使用说明
仅支持绑定固定 Gemini 分组的站内 API Key；不支持复合 Key、智能路由 Key、Antigravity 专用入口或其他平台分组。团队 Key 仍须通过团队身份、成员资格和分组权限检查，产生费用的操作还受团队及成员额度限制。
缓存按创建时的 API Key 和分组隔离，即使同一用户也不能换另一把 Key 使用。查询、续期、删除和生成引用必须使用原 Key、原分组与本站返回的 name；不要填写上游账号的缓存 ID。
列表、查询和删除不产生新费用，余额或消费额度耗尽后仍可操作已付费缓存；Key 停用、IP 限制、团队身份、分组权限及资源归属检查仍然生效。
列表只读取本站归属记录，不透传上游账号的全部缓存，因此不会展示该账号上其他用户的缓存。
常见错误与排查
400 · INVALID_ARGUMENT

Key 类型、分组、请求格式、TTL 或模型不支持；创建要求有可用的输入及缓存存储报价，延长要求有缓存存储报价。

403 · PERMISSION_DENIED

缓存不存在、已过期或不属于当前 Key / 分组时统一返回 CachedContent not found (or permission denied)；创建、续期或生成也可能因协议或额度权限被拒绝。

503 · UNAVAILABLE

没有支持显式缓存的可用账号，或持有缓存的账号暂不可用；不会将同一缓存切换到另一账号。

常见错误与排查
```

---

## Gemini 查询显式缓存

官网页面： https://www.codex2api.com/docs/gemini-cache-get

```text
搜索与扩展
Gemini
Gemini 查询显式缓存
复制 MD

查看指定缓存的模型、用量与到期时间，不返回缓存正文。

GET
/v1beta/cachedContents/{cacheID}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
cacheID	string	是	Path · 创建响应 name 中 cachedContents/ 后的 ID，不能带完整上游 URL。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X GET "$BASE_URL/v1beta/cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "name": "cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl",
  "model": "models/gemini-2.5-flash",
  "displayName": "产品手册",
  "usageMetadata": {
    "totalTokenCount": 32768
  },
  "createTime": "2026-10-13T08:00:00Z",
  "updateTime": "2026-10-13T08:00:00Z",
  "expireTime": "2026-10-13T09:00:00Z"
}
使用说明
仅支持绑定固定 Gemini 分组的站内 API Key；不支持复合 Key、智能路由 Key、Antigravity 专用入口或其他平台分组。团队 Key 仍须通过团队身份、成员资格和分组权限检查，产生费用的操作还受团队及成员额度限制。
缓存按创建时的 API Key 和分组隔离，即使同一用户也不能换另一把 Key 使用。查询、续期、删除和生成引用必须使用原 Key、原分组与本站返回的 name；不要填写上游账号的缓存 ID。
列表、查询和删除不产生新费用，余额或消费额度耗尽后仍可操作已付费缓存；Key 停用、IP 限制、团队身份、分组权限及资源归属检查仍然生效。
查询返回本站保存的缓存元数据。上游提前删除资源或账号暂不可用时，生成仍可能失败，请同时处理生成接口的错误。
常见错误与排查
400 · INVALID_ARGUMENT

Key 类型、分组、请求格式、TTL 或模型不支持；创建要求有可用的输入及缓存存储报价，延长要求有缓存存储报价。

403 · PERMISSION_DENIED

缓存不存在、已过期或不属于当前 Key / 分组时统一返回 CachedContent not found (or permission denied)；创建、续期或生成也可能因协议或额度权限被拒绝。

503 · UNAVAILABLE

没有支持显式缓存的可用账号，或持有缓存的账号暂不可用；不会将同一缓存切换到另一账号。

常见错误与排查
```

---

## Gemini 修改缓存有效期

官网页面： https://www.codex2api.com/docs/gemini-cache-update

```text
搜索与扩展
Gemini
Gemini 修改缓存有效期
复制 MD

调整缓存到期时间；内容、模型与展示名称不能修改。

PATCH
/v1beta/cachedContents/{cacheID}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
cacheID	string	是	Path · 创建响应 name 中 cachedContents/ 后的 ID，不能带完整上游 URL。
updateMask	string	否	Query · 推荐使用 ttl；也支持 expireTime。不能更新模型、内容或 displayName。
ttl	string	条件必填	Body · 从本次请求开始计算的有效期，例如 7200s；与 expireTime 二选一且必须提供其中一个。不是在原到期时间上追加秒数。
expireTime	string	条件必填	Body · RFC 3339 格式的未来到期时间，与 ttl 二选一；不得超过站点及账号允许的有效期上限。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X PATCH "$BASE_URL/v1beta/cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl?updateMask=ttl" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "ttl": "7200s"
}'
JSON
复制
{
  "ttl": "7200s"
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "name": "cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl",
  "model": "models/gemini-2.5-flash",
  "displayName": "产品手册",
  "usageMetadata": {
    "totalTokenCount": 32768
  },
  "createTime": "2026-10-13T08:00:00Z",
  "updateTime": "2026-10-13T08:10:00Z",
  "expireTime": "2026-10-13T10:10:00Z"
}
使用说明
仅支持绑定固定 Gemini 分组的站内 API Key；不支持复合 Key、智能路由 Key、Antigravity 专用入口或其他平台分组。团队 Key 仍须通过团队身份、成员资格和分组权限检查，产生费用的操作还受团队及成员额度限制。
缓存按创建时的 API Key 和分组隔离，即使同一用户也不能换另一把 Key 使用。查询、续期、删除和生成引用必须使用原 Key、原分组与本站返回的 name；不要填写上游账号的缓存 ID。
延长时只对超出原到期时间的新增时长收取存储费用，不重复收取创建输入费用；目标到期时间在调用前确定，网络延迟不会增加收费时长。缩短有效期不退还此前存储费用。
同一缓存的有效期修改与删除串行处理。遇到 409 时等待正在处理的操作结束，再查询当前到期时间，避免连续重复续期。
常见错误与排查
400 · INVALID_ARGUMENT

Key 类型、分组、请求格式、TTL 或模型不支持；创建要求有可用的输入及缓存存储报价，延长要求有缓存存储报价。

403 · PERMISSION_DENIED

缓存不存在、已过期或不属于当前 Key / 分组时统一返回 CachedContent not found (or permission denied)；创建、续期或生成也可能因协议或额度权限被拒绝。

503 · UNAVAILABLE

没有支持显式缓存的可用账号，或持有缓存的账号暂不可用；不会将同一缓存切换到另一账号。

409 · ABORTED

该缓存正在续期或恢复处理，暂时不能再次修改。

常见错误与排查
```

---

## Gemini 删除显式缓存

官网页面： https://www.codex2api.com/docs/gemini-cache-delete

```text
搜索与扩展
Gemini
Gemini 删除显式缓存
复制 MD

删除当前 Key 拥有的指定缓存，成功后不能再引用。

DELETE
/v1beta/cachedContents/{cacheID}

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
x-goog-api-key: $TOKENROUTER_API_KEY
请求参数
参数	类型	必填	说明
cacheID	string	是	Path · 创建响应 name 中 cachedContents/ 后的 ID，不能带完整上游 URL。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'

路径中的占位符需替换为实际模型、任务 ID 或资源 ID；查询任务时使用创建响应返回的 ID。

cURL · Bash
复制
curl --globoff -X DELETE "$BASE_URL/v1beta/cachedContents/abcdefghijklmnopqrstuv234567abcdefghijkl" \
  -H "x-goog-api-key: $TOKENROUTER_API_KEY"
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{}
使用说明
仅支持绑定固定 Gemini 分组的站内 API Key；不支持复合 Key、智能路由 Key、Antigravity 专用入口或其他平台分组。团队 Key 仍须通过团队身份、成员资格和分组权限检查，产生费用的操作还受团队及成员额度限制。
缓存按创建时的 API Key 和分组隔离，即使同一用户也不能换另一把 Key 使用。查询、续期、删除和生成引用必须使用原 Key、原分组与本站返回的 name；不要填写上游账号的缓存 ID。
列表、查询和删除不产生新费用，余额或消费额度耗尽后仍可操作已付费缓存；Key 停用、IP 限制、团队身份、分组权限及资源归属检查仍然生效。
删除不退还已经收取的输入费用和存储费用。缓存过期或删除后，继续查询或引用统一返回 403，而不是空成功响应。
常见错误与排查
400 · INVALID_ARGUMENT

Key 类型、分组、请求格式、TTL 或模型不支持；创建要求有可用的输入及缓存存储报价，延长要求有缓存存储报价。

403 · PERMISSION_DENIED

缓存不存在、已过期或不属于当前 Key / 分组时统一返回 CachedContent not found (or permission denied)；创建、续期或生成也可能因协议或额度权限被拒绝。

503 · UNAVAILABLE

没有支持显式缓存的可用账号，或持有缓存的账号暂不可用；不会将同一缓存切换到另一账号。

409 · ABORTED

该缓存正在续期、删除或恢复处理，请等待操作结束后再试。

常见错误与排查
```

---

## Grok 网页搜索

官网页面： https://www.codex2api.com/docs/grok-web-search

```text
搜索与扩展
Grok
Grok 网页搜索
复制 MD

通过 Grok 原生搜索工具查询网页来源。

POST
/v1/web_search

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
query / input	string	是	Body：二选一；query 优先，必须有非空查询文本。
max_results	integer	否	Body：默认 5，最多 20；非正数使用默认值。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/web_search" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "query": "异步 HTTP API 的轮询设计",
  "max_results": 5
}'
JSON
复制
{
  "query": "异步 HTTP API 的轮询设计",
  "max_results": 5
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "query": "异步 HTTP API 的轮询设计",
  "results": [
    {
      "url": "https://example.com/article",
      "title": "异步接口设计",
      "snippet": "使用任务 ID 轮询状态。"
    }
  ],
  "provider": "grok-native",
  "max_results": 5
}
使用说明
结果仅包含可恢复的真实工具来源，可能少于 max_results 或为空。按分组搜索价格结算。
兼容路径
/web_search
常见错误与排查
400 · invalid_request_error

query/input 为空或 JSON 不合法。

404 · not_found_error

非 Grok 分组。

502 · web_search_error

上游搜索失败。

常见错误与排查
```

---

## Grok X 搜索

官网页面： https://www.codex2api.com/docs/grok-x-search

```text
搜索与扩展
Grok
Grok X 搜索
复制 MD

搜索 X 内容，并可限定账号、日期与媒体理解选项。

POST
/v1/x_search

平台表示上游账号类型。是否可调用还取决于 Key 分组、客户端协议开关、模型权限及账号能力。

授权
HTTP headers
复制
Authorization: Bearer $TOKENROUTER_API_KEY
请求参数

Content-Type: application/json

参数	类型	必填	说明
query / input	string	是	Body：二选一的搜索文本，query 优先。
max_results	integer	否	Body：默认 5，最多 20。
allowed_x_handles / excluded_x_handles	array<string>	否	Body：允许或排除的 X 账号；组合限制由上游验证。
from_date / to_date	string	否	Body：上游支持的日期范围。
enable_image_understanding / enable_video_understanding	boolean	否	Body：启用搜索结果中的图片/视频理解。
请求示例
环境变量（Bash）
复制
export BASE_URL='https://www.codex2api.com'
export TOKENROUTER_API_KEY='sk-your-api-key'
cURL · Bash
复制
curl --globoff -X POST "$BASE_URL/v1/x_search" \
  -H "Authorization: Bearer $TOKENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{
  "query": "AI API updates",
  "max_results": 5,
  "allowed_x_handles": [
    "example"
  ],
  "from_date": "2026-09-01",
  "to_date": "2026-09-30",
  "enable_image_understanding": false
}'
JSON
复制
{
  "query": "AI API updates",
  "max_results": 5,
  "allowed_x_handles": [
    "example"
  ],
  "from_date": "2026-09-01",
  "to_date": "2026-09-30",
  "enable_image_understanding": false
}
响应示例

以下为协议形状示例。模型权限、字段支持和实际返回以当前分组及上游能力为准。

JSON
复制
{
  "query": "AI API updates",
  "results": [
    {
      "url": "https://x.com/example/status/123",
      "title": "API update",
      "snippet": "A matching post."
    }
  ],
  "provider": "grok-native",
  "max_results": 5
}
使用说明
强制使用 x_search 工具，返回结构与网页搜索相同；按分组 X 搜索价格结算。
兼容路径
/x_search
常见错误与排查
400 · invalid_request_error

查询或上游工具参数不合法。

404 · not_found_error

非 Grok 分组。

502 · web_search_error

上游 X 搜索失败。

常见错误与排查
```
