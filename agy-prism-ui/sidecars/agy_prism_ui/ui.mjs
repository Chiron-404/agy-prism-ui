// Shared presentation only. Token counts and breakdown arithmetic stay unchanged.
import { createTurnPresentation } from './turn_ui.mjs';

export function createPresentation(turnFactory = createTurnPresentation) {
  const dictionaries = {
    en: {
      cache: 'Cache', turn0: 'Turn0', read: 'Read', think: 'Think', write: 'Write',
      used: 'used', fiveHours: '5 Hours', weekly: 'Weekly', soon: 'soon', active: 'Active',
      settings: 'Display settings', language: "Display language",
      cdpTitle: 'Prism Lens is off',
      cdpBody: "Agy Prism UI can't reach Antigravity's debugging port, so Optical UI, Insights, and Prism Lens cannot attach to the window. Antigravity does not open this port by default. Sidebar stats still work.",
      cdpHow: 'How to enable', cdpScript: 'One step (Windows): in the folder you downloaded Agy Prism UI to, run', cdpManual: 'Or by hand: add this to the end of the Target field of your Antigravity shortcut', cdpRestart: 'Then quit Antigravity completely and open it again.',
      sidebarStats: 'Statistics', sidebarSettings: 'Settings', sidebarNavigation: 'Sidebar view',
      settingsLanguage: 'Settings language', highlightActiveModel: 'Highlight active model',
      hideUnavailableQuota: 'Hide absent quota windows',
      showCacheWarnings: 'Cache expiry alert',
      showContextWarnings: 'Context overload alert', showRequestErrors: 'Request failure lens',
      highContextTip: 'Context usage is high. Consider compacting or starting a new chat.',
      overflowContextTip: 'Latest request exceeded the model context limit.',
      requestFailure: 'Request failure', retryAfter: 'Server-reported retry wait:',
      error_quota_exhausted: 'Quota exhausted', error_rate_limited: 'Rate limited', error_network_error: 'Disconnected', error_auth_error: 'Authentication error', error_service_unavailable: 'Service busy', error_unknown: 'Unknown reason',
      detail_quota_exhausted: 'The request reported quota exhaustion. Switch to an available model or wait for its quota reset.',
      detail_rate_limited: 'The request was rate limited. Wait and retry.',
      detail_network_error: 'The request connection failed or timed out. Check the connection and retry.',
      detail_auth_error: 'The request failed authentication or permission checks. Check sign-in and account access.',
      detail_service_unavailable: 'The model service is temporarily unavailable. Retry later or switch models.',
      detail_unknown: 'The model request failed, but the reported information does not identify a known cause.',
      showSpeed: 'Generation speed', showRequestMetrics: 'Last request',
      speedAnimation: 'Effects',
      saveFailed: 'Could not save. Please try again.',
      newChat: 'New conversation', cached: 'cached',
      cachedInput: 'Cached input', lastActivity: 'Last recorded activity', cacheWarning: 'Approaching the 4m reminder threshold', cacheCold: '4m threshold reached; cache may be cold',
      context: 'Context details', quota: 'Model quotas',
      contextUsed: 'Used', contextLimit: 'Limit', contextRemaining: 'Remaining', uncachedInput: 'Uncached input', ofLimit: '{pct} of context limit', resetAt: 'Resets', resetUnknown: 'Reset time not reported',
      contextScope: 'Current request input context (excludes its new output).',
      turn0Tip: 'Starting context baseline for this cycle (system prompt and carried history).',
      readTip: 'Added context input (user messages, read files, and tool outputs).',
      writeTip: 'Prior model replies and tool calls kept in current context (excludes latest reply).',
      thinkTip: 'Prior model thinking kept in current context (excludes latest reply).',
      output: "Total output", reply: 'Response / tool calls', thinking: 'Thinking',
      totalTime: "Request duration", streamTime: 'Stream',
      speedTip: "Generation speed = total output ÷ request duration (TTFT + stream).",
      outputTip: "Output of latest request",
      ttftTip: "First-token wait to total duration of the latest request.",
      totalTimeTip: "Request duration (TTFT + stream); excludes tool execution.",
      appearanceSection: 'Appearance', featuresSection: 'Features',
      speedPairTip: 'Lens speed: last completed request in the current turn (— until ready). Effects: breathing dot while running; holds speed color 15s after stopping (≥25 green, 10–25 yellow, <10 red).',
      requestSectionTip: 'Shows Last request (TTFT–total duration and generation speed of the latest recorded call) in panels. Independent of Lens speed.',
      turnSectionTip: 'Aggregates requests, elapsed wall time, write, and thinking tokens from your latest user message to completion.',
      panelLayout: 'Panel height', naturalLayout: 'Natural', matchedLayout: 'Matched',
      density: 'Panel spacing', compact: 'Compact', standard: 'Standard', spacious: 'Spacious',
      quotaIndicator: 'Quota indicator', ring: 'Ring', bar: 'Bar',
      labelCase: 'Label casing', lowercase: 'Lowercase', titlecase: 'Title case',
      contextLayout: 'Context breakdown', turnLayout: 'Turn metrics style', layoutColumns: 'Columns', layoutRows: 'Rows', contextMarker: 'Context marker', turnMarker: 'Turn marker', showContextBreakdown: 'Context breakdown', markerSquare: 'Square', markerDot: 'Dot',
      columnLabel: 'Names in columns', columnValue: 'Values in columns', columnPercent: 'Percentages in columns', fieldName: 'Name', fieldValue: 'Value', fieldPercent: '%', fieldDragTip: 'Drag to reorder; the switch hides or shows this line.',
      resetFormat: 'Reset countdown', compactTime: 'Compact', localizedTime: 'Localized', localizedTimeSample: '4 hr 55 min',
      resetDay: '{n} d', resetHour: '{n} hr', resetMinute: '{n} min', resetMinuteOnly: '{n} min', resetJoin: ' ',
      trendsSection: 'Trends & history', contextTrend: 'Context trend', speedTrend: 'Speed trend',
      sessionTotal: 'Session', sessionTime: 'Active time', modelTime: 'Model time',
      turnsUnit: 'turns', reqsUnit: 'reqs', avgSpeed: 'Avg', streamSpeed: 'Stream', peakSpeed: 'Peak', peakCtx: 'Peak',
      autoCompactAt: 'Auto-compact', totalUsage: 'Total usage',
      compactedBadge: 'Compacted {n}×', turnHistoryTab: 'Turns', reqHistoryTab: 'Requests', noHistory: 'No recorded history yet',
      stepModel: 'Current step model', phasePlan: 'Plan', phaseExec: 'Exec', phaseDirect: 'Direct',
      effortLabel: 'Thinking', effortAuto: 'Auto',
      effortAutoTip: 'Orchestrator adapts thinking depth per step on the server (no fixed tier).',
      stepThinking: 'Step thinking', thinkShort: 'T', routingSummary: 'Model routing', stepsUnit: 'steps', readyNextTurn: 'Ready',
      opticalSection: 'Optical UI', opticalLightTheme: 'Light palette', opticalDarkTheme: 'Dark palette',
      optCrystal: 'Frost', optAlabaster: 'Ivory', optObsidian: 'Noir', optWarm: 'Graphite', optNative: 'Native',
      opticalPrismRim: 'Gemini prism rim', opticalGlass: 'Frosted glass surfaces',
      opticalMotion: 'Stream fade-in & spring motion', opticalCodeTools: 'Sticky & foldable code',
    },
    'zh-CN': {
      cache: '缓存', turn0: '首轮', read: '读取', think: '思考', write: '写入',
      used: '已用', fiveHours: '5小时', weekly: '每周', soon: '即将重置', active: '当前',
      settings: '显示设置', language: "显示语言",
      cdpTitle: 'Prism Lens 未启用',
      cdpBody: '插件连不上 Antigravity 的调试端口，无法注入 Optical UI、Insights 与底栏透镜。Antigravity 默认不开启该端口，侧栏统计不受影响。',
      cdpHow: '设置方法', cdpScript: '一键设置（Windows）：在下载 Agy Prism UI 的文件夹里运行', cdpManual: '或手动：在 Antigravity 快捷方式的「目标」末尾加上', cdpRestart: '然后完全退出 Antigravity，再重新打开。',
      sidebarStats: '统计', sidebarSettings: '设置', sidebarNavigation: 'Sidebar 页面',
      settingsLanguage: '设置语言', highlightActiveModel: '突出当前模型',
      hideUnavailableQuota: '隐藏不存在的配额窗口',
      showCacheWarnings: '缓存过期提醒',
      showContextWarnings: '上下文过载提醒', showRequestErrors: '请求失败透镜',
      highContextTip: '上下文占用较高，建议压缩或开启新对话。',
      overflowContextTip: '最近一次请求已超出上下文上限。',
      requestFailure: '请求失败', retryAfter: '服务端报告的重试等待：',
      error_quota_exhausted: '额度耗尽', error_rate_limited: '429 限流', error_network_error: '断连', error_auth_error: '验证异常', error_service_unavailable: '服务繁忙', error_unknown: '未知原因',
      detail_quota_exhausted: '请求报告额度耗尽。可切换其他可用模型，或等待额度重置。',
      detail_rate_limited: '本次模型请求受到频率限制，请稍后重试。',
      detail_network_error: '本次模型请求连接失败或超时，请检查连接后重试。',
      detail_auth_error: '本次请求未通过验证或权限检查，请检查登录状态和账号权限。',
      detail_service_unavailable: '模型服务暂不可用，可稍后重试或切换其他模型。',
      detail_unknown: '本次模型请求失败，但报告的信息不足以识别已知原因。',
      showSpeed: '生成速度', showRequestMetrics: '最近请求',
      speedAnimation: '动效',
      saveFailed: '保存失败，请重试。',
      newChat: '新对话', cached: '缓存',
      cachedInput: '缓存输入', lastActivity: '最近记录距今', cacheWarning: '接近 4 分钟提醒阈值', cacheCold: '已达 4 分钟阈值，缓存可能已冷却',
      context: '上下文明细', quota: '模型配额',
      contextUsed: '已用', contextLimit: '上限', contextRemaining: '剩余', uncachedInput: '非缓存输入', ofLimit: '占上限 {pct}', resetAt: '重置时间', resetUnknown: '未提供重置时间',
      contextScope: '最近一次请求的输入上下文（不含刚生成的输出）。',
      turn0Tip: '当前周期起始输入基线，包含系统提示词与初始历史。',
      readTip: '对话中新增的输入内容，包括用户消息、读取的文件与工具返回结果。',
      writeTip: '留在当前上下文中的累计回复与工具调用（不含最近一次生成）。',
      thinkTip: '留在当前上下文中的累计思考输出（不含最近一次生成）。',
      output: "总输出", reply: '回复/调用', thinking: '思考',
      totalTime: "请求耗时", streamTime: '流式耗时',
      speedTip: "生成速度 = 总输出 ÷ 单次请求总耗时（首字等待 + 流式输出）。",
      outputTip: "最近一次请求输出",
      ttftTip: "首字等待耗时 – 单次请求总耗时（已包含首字等待）。",
      totalTimeTip: "请求总耗时（首字等待 + 流式输出，不含工具执行）。",
      appearanceSection: '外观', featuresSection: '功能',
      speedPairTip: '底栏速度：本轮最近一次已完成请求的速度（未完成显示 —）。动效：运行中圆点呼吸，结束后保色 15 秒再变灰（≥25 绿、10–25 黄、<10 红）。',
      requestSectionTip: '在面板展示最近一次请求的 TTFT–总耗时与生成速度，与底栏透镜独立。',
      turnSectionTip: '从最近一条用户消息到结束，按整轮累计请求数、耗时、写入与思考。',
      panelLayout: '面板高度', naturalLayout: '自然高度', matchedLayout: '对齐高度',
      density: '面板间距', compact: '紧凑', standard: '标准', spacious: '舒展',
      quotaIndicator: '额度图形', ring: '圆环', bar: '进度条',
      labelCase: '面板大小写', lowercase: '全小写', titlecase: '首字母大写',
      contextLayout: '上下文明细', turnLayout: '本轮统计样式', layoutColumns: '竖线', layoutRows: '横条', contextMarker: '上下文标记', turnMarker: '本轮标记', showContextBreakdown: '上下文明细', markerSquare: '方块', markerDot: '圆点',
      columnLabel: '竖线显示名称', columnValue: '竖线显示数值', columnPercent: '竖线显示百分比', fieldName: '名称', fieldValue: '数值', fieldPercent: '百分比', fieldDragTip: '拖动调整顺序，开关控制这一行显示或隐藏。',
      resetFormat: '重置倒计时', compactTime: '简写', localizedTime: '本地化', localizedTimeSample: '4小时55分',
      resetDay: '{n}天', resetHour: '{n}小时', resetMinute: '{n}分', resetMinuteOnly: '{n}分钟', resetJoin: '',
      trendsSection: '波动与历史', contextTrend: '上下文波动', speedTrend: '速度波动',
      sessionTotal: '会话', sessionTime: '活跃耗时', modelTime: '模型耗时',
      turnsUnit: '轮', reqsUnit: '次请求', avgSpeed: '均速', streamSpeed: '流式', peakSpeed: '峰值', peakCtx: '峰值',
      autoCompactAt: '自动压缩线', totalUsage: '累计用量',
      compactedBadge: '已压缩 {n} 次', turnHistoryTab: '轮次历史', reqHistoryTab: '请求历史', noHistory: '暂无历史记录',
      stepModel: '当前步骤模型', phasePlan: '规划', phaseExec: '执行', phaseDirect: '独立',
      effortLabel: '思考档', effortAuto: '自动',
      effortAutoTip: 'Orchestrator 由服务端按步动态分配思考深度（无固定档位）。',
      stepThinking: '本步思考', thinkShort: '思', routingSummary: '模型分工', stepsUnit: '步', readyNextTurn: '待发送',
      opticalSection: '光学外观', opticalLightTheme: '浅色配色', opticalDarkTheme: '深色配色',
      optCrystal: '白昼', optAlabaster: '晨光', optObsidian: '午夜', optWarm: '暮色', optNative: '原生',
      opticalPrismRim: 'Gemini 棱镜流光', opticalGlass: '通透玻璃质感',
      opticalMotion: '流式输出渐现动效', opticalCodeTools: '长代码块折叠与吸顶栏',
    },
    'zh-TW': {
      cache: '快取', turn0: '首輪', read: '讀取', think: '思考', write: '寫入',
      used: '已用', fiveHours: '5小時', weekly: '每週', soon: '即將重設', active: '目前',
      settings: '顯示設定', language: "顯示語言",
      cdpTitle: 'Prism Lens 未啟用',
      cdpBody: '外掛連不上 Antigravity 的偵錯連接埠，無法注入 Optical UI、Insights 與底欄透鏡。Antigravity 預設不開啟該連接埠，側欄統計不受影響。',
      cdpHow: '設定方法', cdpScript: '一鍵設定（Windows）：在下載 Agy Prism UI 的資料夾裡執行', cdpManual: '或手動：在 Antigravity 捷徑的「目標」末尾加上', cdpRestart: '然後完全結束 Antigravity，再重新開啟。',
      sidebarStats: '統計', sidebarSettings: '設定', sidebarNavigation: 'Sidebar 頁面',
      settingsLanguage: '設定語言', highlightActiveModel: '突出目前模型',
      hideUnavailableQuota: '隱藏不存在的配額視窗',
      showCacheWarnings: '快取過期提醒',
      showContextWarnings: '上下文過載提醒', showRequestErrors: '請求失敗透鏡',
      highContextTip: '上下文佔用較高，建議壓縮或開啟新對話。',
      overflowContextTip: '最近一次請求已超出上下文上限。',
      requestFailure: '請求失敗', retryAfter: '服務端回報的重試等待：',
      error_quota_exhausted: '額度耗盡', error_rate_limited: '429 限流', error_network_error: '斷連', error_auth_error: '驗證異常', error_service_unavailable: '服務繁忙', error_unknown: '未知原因',
      detail_quota_exhausted: '請求回報額度耗盡。可切換其他可用模型，或等待額度重設。',
      detail_rate_limited: '本次模型請求受到頻率限制，請稍後重試。',
      detail_network_error: '本次模型請求連線失敗或逾時，請檢查連線後重試。',
      detail_auth_error: '本次請求未通過驗證或權限檢查，請檢查登入狀態和帳號權限。',
      detail_service_unavailable: '模型服務暫不可用，可稍後重試或切換其他模型。',
      detail_unknown: '本次模型請求失敗，但回報的資訊不足以識別已知原因。',
      showSpeed: '生成速度', showRequestMetrics: '最近請求',
      speedAnimation: '動效',
      saveFailed: '儲存失敗，請重試。',
      newChat: '新對話', cached: '快取',
      cachedInput: '快取輸入', lastActivity: '最近記錄距今', cacheWarning: '接近 4 分鐘提醒閾值', cacheCold: '已達 4 分鐘閾值，快取可能已冷卻',
      context: '上下文明細', quota: '模型配額',
      contextUsed: '已用', contextLimit: '上限', contextRemaining: '剩餘', uncachedInput: '非快取輸入', ofLimit: '佔上限 {pct}', resetAt: '重設時間', resetUnknown: '未提供重設時間',
      contextScope: '最近一次請求的輸入上下文（不含剛產生的輸出）。',
      turn0Tip: '目前週期起始輸入基線，包含系統提示詞與初始歷史。',
      readTip: '對話中新增的輸入內容，包括使用者訊息、讀取的檔案與工具回傳結果。',
      writeTip: '留在目前上下文中的累計回覆與工具呼叫（不含最近一次生成）。',
      thinkTip: '留在目前上下文中的累計思考輸出（不含最近一次生成）。',
      output: "總輸出", reply: '回覆/呼叫', thinking: '思考',
      totalTime: "請求耗時", streamTime: '串流耗時',
      speedTip: "生成速度 = 總輸出 ÷ 單次請求總耗時（首字等待 + 串流輸出）。",
      outputTip: "最近一次請求輸出",
      ttftTip: "首字等待耗時 – 單次請求總耗時（已包含首字等待）。",
      totalTimeTip: "請求總耗時（首字等待 + 串流輸出，不含工具執行）。",
      appearanceSection: '外觀', featuresSection: '功能',
      speedPairTip: '底欄速度：本輪最近一次已完成請求的速度（未完成顯示 —）。動效：執行中圓點呼吸，結束後保色 15 秒再變灰（≥25 綠、10–25 黃、<10 紅）。',
      requestSectionTip: '於面板展示最近一次請求的 TTFT–總耗時與生成速度，與底欄透鏡獨立。',
      turnSectionTip: '從最近一條使用者訊息到結束，依整輪累計請求數、耗時、寫入與思考。',
      panelLayout: '面板高度', naturalLayout: '自然高度', matchedLayout: '對齊高度',
      density: '面板間距', compact: '緊湊', standard: '標準', spacious: '舒展',
      quotaIndicator: '額度圖形', ring: '圓環', bar: '進度條',
      labelCase: '面板大小寫', lowercase: '全小寫', titlecase: '首字母大寫',
      contextLayout: '上下文明細', turnLayout: '本輪統計樣式', layoutColumns: '豎線', layoutRows: '橫條', contextMarker: '上下文標記', turnMarker: '本輪標記', showContextBreakdown: '上下文明細', markerSquare: '方塊', markerDot: '圓點',
      columnLabel: '豎線顯示名稱', columnValue: '豎線顯示數值', columnPercent: '豎線顯示百分比', fieldName: '名稱', fieldValue: '數值', fieldPercent: '百分比', fieldDragTip: '拖動調整順序，開關控制這一行顯示或隱藏。',
      resetFormat: '重設倒數', compactTime: '簡寫', localizedTime: '在地化', localizedTimeSample: '4小時55分',
      resetDay: '{n}天', resetHour: '{n}小時', resetMinute: '{n}分', resetMinuteOnly: '{n}分鐘', resetJoin: '',
      trendsSection: '波動與歷史', contextTrend: '上下文波動', speedTrend: '速度波動',
      sessionTotal: '工作階段', sessionTime: '活躍耗時', modelTime: '模型耗時',
      turnsUnit: '輪', reqsUnit: '次請求', avgSpeed: '均速', streamSpeed: '串流', peakSpeed: '峰值', peakCtx: '峰值',
      autoCompactAt: '自動壓縮線', totalUsage: '累計用量',
      compactedBadge: '已壓縮 {n} 次', turnHistoryTab: '輪次歷史', reqHistoryTab: '請求歷史', noHistory: '暫無歷史記錄',
      stepModel: '目前步驟模型', phasePlan: '規劃', phaseExec: '執行', phaseDirect: '獨立',
      effortLabel: '思考檔', effortAuto: '自動',
      effortAutoTip: 'Orchestrator 由服務端依步驟動態分配思考深度（無固定檔位）。',
      stepThinking: '本步思考', thinkShort: '思', routingSummary: '模型分工', stepsUnit: '步', readyNextTurn: '待發送',
      opticalSection: '光學外觀', opticalLightTheme: '淺色配色', opticalDarkTheme: '深色配色',
      optCrystal: '白晝', optAlabaster: '晨光', optObsidian: '午夜', optWarm: '暮色', optNative: '原生',
      opticalPrismRim: 'Gemini 稜鏡流光', opticalGlass: '通透玻璃質感',
      opticalMotion: '串流輸出漸現動效', opticalCodeTools: '長程式碼摺疊與吸頂欄',
    },
  };
  function locale(prefs = {}, candidates = []) {
    if (dictionaries[prefs.language]) return prefs.language;
    for (const raw of candidates) {
      const value = String(raw || '').toLowerCase().replace(/_/g, '-');
      if (!value) continue;
      if (value.startsWith('zh')) return /hant|tw|hk|mo/.test(value) ? 'zh-TW' : 'zh-CN';
      if (value.startsWith('en')) return 'en';
    }
    return 'en';
  }
  function systemLocale(prefs) {
    return locale(prefs, [navigator.language, ...(navigator.languages || [])]);
  }
  function formatTokens(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    const n = Math.max(0, Number(value));
    if (n < 1000) return String(Math.round(n));
    const k = Math.round(n / 100) / 10;
    if (k < 100) return k.toFixed(1) + 'K';
    const kInt = Math.round(n / 1000);
    if (kInt < 1000) return kInt + 'K';
    const m = Math.round(n / 100000) / 10;
    return m >= 100 ? Math.round(n / 1000000) + 'M' : m.toFixed(1) + 'M';
  }
  const { dictionaries: turnDictionaries, ...turnMethods } = turnFactory(formatTokens);
  for (const language of Object.keys(dictionaries)) Object.assign(dictionaries[language], turnDictionaries[language]);
  function cacheTooltip(data = {}, t = dictionaries.en, nowMs = Date.now(), prefs = {}) {
    const context = Number(data.contextTokens) || 0;
    if (context <= 0) return `0 / 0 ${t.cached} · ${t.newChat}`;
    const timestamp = Number(data.lastStepEpochMs);
    const seconds = Number.isFinite(timestamp) && timestamp > 0 ? Math.max(0, Math.floor((nowMs - timestamp) / 1000)) : null;
    const minutes = seconds === null ? null : Math.floor(seconds / 60);
    const age = minutes === null ? '—' : minutes < 1 ? '<1m' : minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
    const warn = prefs?.showCacheWarnings !== false && seconds !== null;
    const state = !warn ? '' : seconds >= 240 ? t.cacheCold : seconds >= 180 ? t.cacheWarning : '';
    return `${t.cachedInput}: ${formatTokens(data.cachedIn ?? 0)} / ${formatTokens(context)} tokens · ${t.lastActivity}: ${age}${state ? ' · ' + state : ''}`;
  }
  function cacheView(data = {}, prefs = {}, nowMs = Date.now()) {
    const ctx = data.contextTokens || 0;
    const cached = data.cachedIn || 0;
    const hitPct = ctx > 0 ? Math.round((cached / ctx) * 100) : 0;
    const warn = prefs?.showCacheWarnings !== false;
    const idleSec = warn && ctx > 0 && data.lastStepEpochMs ? Math.max(0, Math.floor((nowMs - data.lastStepEpochMs) / 1000)) : 0;
    if (idleSec >= 240) {
      return {
        status: 'cold',
        iconSvg: '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#e06c75" stroke-width="2" stroke-linecap="round"><line x1="2.2" y1="2.2" x2="9.8" y2="9.8"/><line x1="9.8" y1="2.2" x2="2.2" y2="9.8"/></svg>',
        valColor: '', valDeco: 'line-through', valOp: '0.5', text: hitPct + '%', countdown: '',
        ctxIconColor: 'rgba(208, 122, 128, 0.88)',
      };
    }
    if (idleSec >= 180) {
      const remMin = Math.max(1, Math.ceil((240 - idleSec) / 60));
      return {
        status: 'warning',
        iconSvg: '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#d4940a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="4.8"/><polyline points="6 3.5 6 6 7.8 7.2"/></svg>',
        valColor: '#d4940a', valDeco: 'none', valOp: '1', text: hitPct + '%', countdown: '~' + remMin + 'm',
        ctxIconColor: 'rgba(206, 168, 92, 0.88)',
      };
    }
    return {
      status: 'fresh',
      iconSvg: '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6.5 4.8 9.2 10 3"/></svg>',
      valColor: '', valDeco: 'none', valOp: '1', text: hitPct + '%', countdown: '',
      ctxIconColor: '',
    };
  }
  function contextTooltips(data = {}, t = dictionaries.en) {
    const context = data.contextTokens || 0;
    const limit = data.maxContextTokens || 0;
    const compactAt = data.compactionThresholdTokens || 0;
    const cached = data.cachedIn || 0;
    const turn0 = data.turn0Tokens || 0;
    const write = data.totalOutputTokens || 0;
    const think = data.totalThinkingTokens || 0;
    const read = Math.max(0, context - turn0 - write - think);
    const compactSuffix = compactAt > 0 && compactAt !== limit ? ` · ${t.autoCompactAt} ${formatTokens(compactAt)}` : '';
    const row = (key, value) => `${t[key]}: ${formatTokens(value)} tokens${limit > 0 ? ` · ${t.ofLimit.replace('{pct}', Math.round(value / limit * 100) + '%')}` : ''}\n${t[key + 'Tip']}`;
    return {
      overview: `${t.contextScope}\n${t.contextUsed} ${formatTokens(context)} / ${t.contextLimit} ${limit > 0 ? formatTokens(limit) : '—'} · ${t.contextRemaining} ${limit > 0 ? formatTokens(Math.max(0, limit - context)) : '—'}${compactSuffix}\n${t.cachedInput} ${formatTokens(cached)} · ${t.uncachedInput} ${formatTokens(data.uncachedIn ?? Math.max(0, context - cached))}`,
      turn0: row('turn0', turn0), read: row('read', read), write: row('write', write), think: row('think', think),
    };
  }
  function renderContextTooltips(root, data, t) {
    const tips = contextTooltips(data, t);
    for (const node of root.querySelectorAll('[data-context-tip]')) node.title = tips[node.dataset.contextTip];
  }
  function quotaTooltip(data, t = dictionaries.en) {
    const date = data.resetTime ? new Date(data.resetTime) : null;
    const pad = n => String(n).padStart(2, '0');
    return date && Number.isFinite(date.getTime())
      ? `${t.resetAt} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
      : t.resetUnknown;
  }
  function applyQuotaTooltips(root, t) {
    for (const row of root.querySelectorAll('[data-quota-tooltip]')) row.title = quotaTooltip(JSON.parse(row.dataset.quotaTooltip), t);
  }
  function alertView(data = {}, prefs = {}, t = dictionaries.en) {
    const kind = data.requestError?.kind || 'none';
    const ratio = data.maxContextTokens > 0 ? (data.contextTokens || 0) / data.maxContextTokens : 0;
    const contextTone = prefs.showContextWarnings === false ? '' : kind === 'context_overflow' || ratio >= .9 ? 'error' : ratio >= .75 ? 'warning' : '';
    const contextTip = !contextTone ? '' : kind === 'context_overflow' ? t.overflowContextTip : t.highContextTip;
    const visible = prefs.showRequestErrors !== false && ['quota_exhausted', 'rate_limited', 'network_error', 'auth_error', 'service_unavailable', 'unknown'].includes(kind);
    const label = visible ? t['error_' + kind] : '';
    const wait = data.requestError?.retryAfterSec;
    const detail = visible ? t['detail_' + kind] + (kind === 'rate_limited' && typeof wait === 'number' ? ` ${t.retryAfter} ${wait}s` : '') : '';
    const diagnostic = visible ? data.requestError?.diagnostic || '' : '';
    return { contextTone, contextTip, visible, label, detail, diagnostic };
  }
  function renderAlerts(root, data, prefs, t) {
    const view = alertView(data, prefs, t);
    root.dataset.contextTone = view.contextTone;
    if (view.contextTip) for (const node of root.querySelectorAll('[data-context-tip="overview"]')) node.title += '\n' + view.contextTip;
    for (const node of root.querySelectorAll('[data-request-error]')) {
      node.textContent = view[node.dataset.requestError];
    }
    const group = root.querySelector('[data-el="grpError"]');
    if (group) {
      group.hidden = !view.visible;
      group.querySelector('.dk-pill').setAttribute('aria-label', `${t.requestFailure}: ${view.label}`);
      group.querySelector('.dk-pill').title = [view.label, view.detail, view.diagnostic].filter(Boolean).join('\n');
    }
    return view;
  }
  function generationText(g = {}, t = dictionaries.en) {
    const seconds = n => n !== null && n !== undefined && Number.isFinite(n) ? n.toFixed(1) + 's' : '—';
    const split = g.reply !== null && g.reply !== undefined && g.thinking !== null && g.thinking !== undefined
      ? `${t.reply} ${formatTokens(g.reply)} + ${t.thinking} ${formatTokens(g.thinking)}` : '';
    const ttft = seconds(g.ttft);
    const totalTime = seconds(g.duration);
    const timing = ttft !== '—' && totalTime !== '—' ? `${ttft}–${totalTime}` : ttft;
    const outputLine = g.output !== null && g.output !== undefined
      ? `\n${t.outputTip}: ${formatTokens(g.output)} tokens${split ? ` (${split})` : ''}`
      : '';
    const timingTitle = `${t.ttftTip}\nTTFT ${ttft} · ${t.streamTime} ${seconds(g.streaming)} · ${t.totalTime} ${totalTime}`;
    const totalTimeTitle = `${t.totalTimeTip}\nTTFT ${ttft} · ${t.streamTime} ${seconds(g.streaming)} · ${t.totalTime} ${totalTime}`;
    return {
      speed: g.tps !== null && g.tps !== undefined ? g.tps.toFixed(1) + ' tok/s' : '—',
      output: formatTokens(g.output),
      ttft,
      totalTime,
      timing,
      speedTitle: `${t.speedTip}${outputLine}`,
      outputTitle: `${t.outputTip}: ${formatTokens(g.output)} tokens${split ? ` (${split})` : ''}`,
      ttftTitle: t.ttftTip,
      totalTimeTitle,
      timingTitle,
    };
  }
  function generationMarkup() {
    return `<div data-generation-group="request"><div class="generation-grid"><div class="generation-row" data-generation-row="timing"><span>TTFT</span><span data-generation="timing">—</span></div><div class="generation-row" data-generation-row="speed"><span data-generation="speed">—</span></div></div></div>`;
  }
  function renderGeneration(root, generation, labels, prefs = {}) {
    const view = generationText(generation || {}, labels);
    for (const key of ['timing', 'speed']) {
      for (const node of root.querySelectorAll(`[data-generation="${key}"]`)) {
        node.hidden = false;
        if (node.textContent !== view[key]) node.textContent = view[key];
        if (node.title !== view[key + 'Title']) node.title = view[key + 'Title'];
      }
      for (const row of root.querySelectorAll(`[data-generation-row="${key}"]`)) {
        row.hidden = false;
        row.title = view[key + 'Title'];
      }
    }
    for (const block of root.querySelectorAll('[data-generation-block]')) block.hidden = prefs.showRequestMetrics === false || !generation || generation.requestIndex == null;
    return view;
  }
  function appearance(prefs = {}) {
    return { panelLayout: prefs.panelLayout || 'natural', density: prefs.density || 'compact', quotaIndicator: prefs.quotaIndicator || 'ring', labelCase: prefs.labelCase || 'lowercase', resetFormat: prefs.resetFormat === 'localized' ? 'localized' : 'compact', contextLayout: prefs.contextLayout === 'rows' ? 'rows' : 'columns', turnLayout: prefs.turnLayout === 'rows' ? 'rows' : 'columns', contextMarker: prefs.contextMarker === 'dot' ? 'dot' : 'square', turnMarker: prefs.turnMarker === 'dot' ? 'dot' : 'square', showContextBreakdown: String(prefs.showContextBreakdown !== false), columnLabel: String(prefs.columnLabel !== false), columnValue: String(prefs.columnValue !== false), columnPercent: String(prefs.columnPercent === true) };
  }
  function formatReset(isoStr, prefs = {}, now = Date.now()) {
    if (!isoStr) return '';
    const diffMs = new Date(isoStr).getTime() - now;
    if (!Number.isFinite(diffMs)) return '';
    const t = dictionaries[systemLocale(prefs)] || dictionaries.en;
    if (diffMs <= 0) return t.soon;
    const totalMin = Math.floor(diffMs / 60000);
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;
    if (appearance(prefs).resetFormat === 'localized') {
      const unit = (key, n) => t[key].replace('{n}', n);
      if (d > 0) return unit('resetDay', d) + t.resetJoin + unit('resetHour', h);
      if (h > 0) return unit('resetHour', h) + t.resetJoin + unit('resetMinute', m);
      return unit('resetMinuteOnly', Math.max(1, m));
    }
    if (d > 0) return d + 'd ' + String(h).padStart(2, '0') + 'h';
    if (h > 0) return h + 'h ' + String(m).padStart(2, '0') + 'm';
    return Math.max(1, m) + 'm';
  }
  function apply(root, prefs = {}) {
    root.style.colorScheme = '';
    for (const key of ['--background', '--foreground', '--card', '--muted-foreground', '--secondary', '--secondary-foreground', '--border']) {
      if (root.style.getPropertyValue(key) !== '') root.style.removeProperty(key);
    }
    const visual = appearance(prefs);
    for (const [key, value] of Object.entries(visual)) root.dataset[key] = value;
    const fieldOrder = String(prefs.columnOrder || 'label,value,percent').split(',');
    for (const field of ['label', 'value', 'percent']) root.style.setProperty('--agy-order-' + field, String(Math.max(0, fieldOrder.indexOf(field))));
    const scale = { compact: [4, 6, 8, 10], standard: [6, 8, 10, 12], spacious: [8, 11, 12, 14] }[visual.density] || [4, 6, 8, 10];
    for (const [index, key] of ['--agy-row-gap', '--agy-section-gap', '--agy-pad-y', '--agy-pad-x'].entries()) root.style.setProperty(key, scale[index] + 'px');
    root.dataset.highlightActiveModel = prefs.highlightActiveModel === true ? 'true' : 'false';
    const language = systemLocale(prefs);
    root.dataset.language = language;
    const t = dictionaries[language];
    const settingsLanguage = dictionaries[prefs.settingsLanguage] ? prefs.settingsLanguage : 'zh-CN';
    const settings = root.querySelector('.settings');
    if (settings) settings.lang = settingsLanguage;
    for (const node of root.querySelectorAll('[data-i18n]')) {
      const dict = node.closest('.settings') ? dictionaries[settingsLanguage] : t;
      const value = dict[node.dataset.i18n];
      if (value && node.textContent !== value) node.textContent = value;
    }
    for (const node of root.querySelectorAll('[data-stats-i18n]')) {
      const value = t[node.dataset.statsI18n];
      if (value && node.textContent !== value) node.textContent = value;
    }
    applyQuotaTooltips(root, t);
    return t;
  }
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function formatSessionSeconds(value) {
    if (!Number.isFinite(value) || value < 0) return '—';
    const seconds = Math.floor(value);
    if (seconds < 60) return seconds + 's';
    return seconds < 3600 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  function speedTierColor(tps) {
    if (!Number.isFinite(tps) || tps <= 0) return '#388bfd';
    return tps >= 25 ? '#4ea84e' : tps >= 10 ? '#d4940a' : '#e06c75';
  }
  function buildContextSvg(requests = [], maxLimit = 0, { width = 280, height = 64, showDots = true, compactionLimit = 0 } = {}) {
    const pts = requests.filter(r => (r.contextTokens || 0) > 0);
    if (pts.length === 0) return '';
    const padX = 5;
    const padY = 6;
    const peak = Math.max(1, ...pts.map(p => p.contextTokens));
    const compactAt = compactionLimit || pts.at(-1)?.compactionThresholdTokens || 0;
    const ceil = maxLimit > 0 ? Math.max(peak, maxLimit) : Math.max(peak * 1.1, compactAt * 1.05);
    const coords = pts.map((p, idx) => {
      const x = pts.length === 1 ? width / 2 : padX + (idx / (pts.length - 1)) * (width - padX * 2);
      const y = height - padY - (p.contextTokens / ceil) * (height - padY * 2);
      return { x, y, ...p };
    });
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const area = coords.length > 1
      ? `${line} L${coords[coords.length - 1].x.toFixed(1)},${height - padY} L${coords[0].x.toFixed(1)},${height - padY} Z`
      : '';
    const compactLine = compactAt > 0 && compactAt < ceil * 0.98
      ? (() => {
          const cy = height - padY - (compactAt / ceil) * (height - padY * 2);
          return `<line x1="${padX}" y1="${cy.toFixed(1)}" x2="${width - padX}" y2="${cy.toFixed(1)}" stroke="#d4940a" stroke-opacity="0.65" stroke-width="1" stroke-dasharray="3 3"/>`;
        })()
      : '';
    const dots = showDots
      ? coords.map(c => {
          const color = c.compacted ? '#d4940a' : '#388bfd';
          const r = c.compacted ? 3.2 : (coords.length > 28 ? 1.5 : 2.3);
          const tip = `#${c.requestIndex + 1}: ${formatTokens(c.contextTokens)}${maxLimit > 0 ? ' / ' + formatTokens(maxLimit) : ''} (Cache ${formatTokens(c.cachedIn)})${c.compacted ? ' · Compacted' : ''}`;
          return `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="${color}"><title>${escapeHtml(tip)}</title></circle>`;
        }).join('')
      : '';
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="display:block;overflow:visible">`
      + `<line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="rgba(142,142,147,0.22)" stroke-width="1"/>`
      + compactLine
      + (area ? `<path d="${area}" fill="#388bfd" fill-opacity="0.16"/>` : '')
      + (coords.length > 1 ? `<path d="${line}" fill="none" stroke="#388bfd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : '')
      + dots + `</svg>`;
  }
  function buildTpsSvg(requests = [], avgTps = null, { width = 280, height = 64, maxBars = 28 } = {}) {
    const measured = requests.filter(r => Number.isFinite(r.tps) && r.tps > 0).slice(-maxBars);
    if (measured.length === 0) return '';
    const padX = 5;
    const padY = 6;
    const maxVal = Math.max(10, ...measured.map(r => r.tps), Number(avgTps) || 0) * 1.12;
    const slotW = (width - padX * 2) / measured.length;
    const barW = Math.max(2.5, Math.min(14, slotW * 0.68));
    const bars = measured.map((r, idx) => {
      const bh = Math.max(2.5, (r.tps / maxVal) * (height - padY * 2));
      const x = padX + idx * slotW + (slotW - barW) / 2;
      const y = height - padY - bh;
      const fill = speedTierColor(r.tps);
      const timing = Number.isFinite(r.ttft) && Number.isFinite(r.duration) ? ` · TTFT ${r.ttft.toFixed(1)}s–${r.duration.toFixed(1)}s` : '';
      const streamPart = Number.isFinite(r.streamTps) ? ` · Stream ${r.streamTps.toFixed(1)} tok/s` : '';
      const tip = `#${r.requestIndex + 1}: ${r.tps.toFixed(1)} tok/s${streamPart} (${formatTokens(r.output)} tok${timing})`;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="1.8" fill="${fill}" fill-opacity="0.88"><title>${escapeHtml(tip)}</title></rect>`;
    }).join('');
    const avgLine = Number.isFinite(avgTps) && avgTps > 0
      ? (() => {
          const ay = height - padY - (avgTps / maxVal) * (height - padY * 2);
          return `<line x1="${padX}" y1="${ay.toFixed(1)}" x2="${width - padX}" y2="${ay.toFixed(1)}" stroke="rgba(142,142,147,0.55)" stroke-width="1" stroke-dasharray="3 3"/>`;
        })()
      : '';
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="display:block;overflow:visible">`
      + `<line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="rgba(142,142,147,0.22)" stroke-width="1"/>`
      + avgLine + bars + `</svg>`;
  }
  function sessionTotalDurationSec(summary = {}, nowMs = Date.now()) {
    const base = Number(summary.completedTurnsDurationSec) || 0;
    const runningStart = Number(summary.runningTurnStartedAtMs) || 0;
    const live = runningStart > 0 && nowMs >= runningStart ? (nowMs - runningStart) / 1000 : 0;
    const total = base + live;
    return total > 0 || summary.turnCount > 0 ? total : null;
  }
  function historyMarkup(className = 'dk-generation') {
    return `<div class="${className} dk-history-block" data-history-block hidden>`
      + `<div class="generation-grid"><div class="generation-row" data-history-row="session"><span data-i18n="sessionTotal">Session</span><span data-history="sessionText">—</span></div>`
      + `<div class="generation-row" data-generation-row="speed" data-history-row="avg"><span data-history="avgText">—</span></div></div>`
      + `<div class="dk-spark-pair"><div class="dk-spark-cell" data-history="ctxSpark"></div><div class="dk-spark-cell" data-history="tpsSpark"></div></div>`
      + `</div>`;
  }
  function renderHistory(root, history, labels = dictionaries.en, maxLimit = 0, nowMs = Date.now()) {
    const blocks = root.querySelectorAll('[data-history-block]');
    const requests = history?.requests || [];
    const summary = history?.summary || {};
    const visible = requests.length > 0;
    for (const block of blocks) {
      block.hidden = !visible;
      if (!visible) continue;
      const totalSec = sessionTotalDurationSec(summary, nowMs);
      const durStr = formatSessionSeconds(totalSec);
      const turnsStr = summary.turnCount > 0 ? `${summary.turnCount} ${labels.turnsUnit}` : `${summary.requestCount || requests.length} ${labels.reqsUnit}`;
      const sessionText = durStr !== '—' ? `${turnsStr} · ${durStr}` : turnsStr;
      const avgText = Number.isFinite(summary.avgTps) ? `${labels.avgSpeed} ${summary.avgTps.toFixed(1)} tok/s` : '—';
      const streamText = Number.isFinite(summary.avgStreamTps) ? `${ summary.avgStreamTps.toFixed(1)} tok/s` : '—';
      const sNode = block.querySelector('[data-history="sessionText"]');
      if (sNode && sNode.textContent !== sessionText) sNode.textContent = sessionText;
      const aNode = block.querySelector('[data-history="avgText"]');
      if (aNode && aNode.textContent !== avgText) aNode.textContent = avgText;
      const sRow = block.querySelector('[data-history-row="session"]');
      if (sRow) sRow.title = `${labels.sessionTime}: ${durStr} · ${labels.modelTime}: ${formatSessionSeconds(summary.totalModelDurationSec)} · ${summary.requestCount || requests.length} ${labels.reqsUnit} · ${labels.totalUsage}: ${formatTokens(summary.totalSessionTokens || 0)}`;
      const aRow = block.querySelector('[data-history-row="avg"]');
      if (aRow) aRow.title = `${labels.avgSpeed}: ${Number.isFinite(summary.avgTps) ? summary.avgTps.toFixed(1) + ' tok/s' : '—'} · ${labels.streamSpeed}: ${streamText} · ${labels.peakSpeed}: ${Number.isFinite(summary.peakTps) ? summary.peakTps.toFixed(1) + ' tok/s' : '—'}`;
      const sparkKey = `${requests.length}:${maxLimit}:${requests.at(-1)?.requestIndex}:${requests.at(-1)?.contextTokens}:${requests.at(-1)?.tps?.toFixed?.(1)}`;
      if (block.dataset.sparkKey !== sparkKey) {
        block.dataset.sparkKey = sparkKey;
        const cCell = block.querySelector('[data-history="ctxSpark"]');
        if (cCell) cCell.innerHTML = buildContextSvg(requests, maxLimit, { width: 100, height: 24, showDots: false, compactionLimit: summary.compactionThresholdTokens });
        const tCell = block.querySelector('[data-history="tpsSpark"]');
        if (tCell) tCell.innerHTML = buildTpsSvg(requests, summary.avgTps, { width: 100, height: 24, maxBars: 16 });
      }
    }
  }
  function renderSidebarHistory(container, history, maxLimit = 0, labels = dictionaries.en, nowMs = Date.now(), convKey = '') {
    if (!container) return;
    if (convKey && container._convKey !== convKey) {
      container._convKey = convKey;
      container._expandedTurns = new Set();
      container._expandedReqs = new Set();
      container._renderKey = '';
      const existingList = container.querySelector?.('.hist-list');
      if (existingList) existingList.scrollTop = 0;
    }
    const requests = history?.requests || [];
    const turns = history?.turns || [];
    const summary = history?.summary || {};
    if (requests.length === 0 && turns.length === 0) {
      container.hidden = true;
      container._renderKey = '';
      container.replaceChildren();
      return;
    }
    container.hidden = false;
    const activeTab = container._histTab || 'turns';
    const expandedTurns = container._expandedTurns instanceof Set
      ? container._expandedTurns
      : (container._expandedTurns = new Set());
    const expandedReqs = container._expandedReqs instanceof Set
      ? container._expandedReqs
      : (container._expandedReqs = new Set());
    const totalSec = sessionTotalDurationSec(summary, nowMs);
    const durStr = formatSessionSeconds(totalSec);
    const modelDurStr = formatSessionSeconds(summary.totalModelDurationSec);
    const lastReq = requests.at(-1);
    const firstTurn = turns[0];
    const makeRenderKey = () => [
      container._convKey || '',
      activeTab,
      [...expandedTurns].sort((a, b) => a - b).join(',') + ';' + [...expandedReqs].sort((a, b) => a - b).join(','),
      labels.trendsSection,
      maxLimit,
      summary.turnCount,
      summary.requestCount,
      summary.totalSessionTokens,
      summary.compactionCount,
      summary.compactionThresholdTokens,
      lastReq?.requestIndex,
      lastReq?.contextTokens,
      lastReq?.tps?.toFixed?.(1),
      lastReq?.ttft?.toFixed?.(1),
      firstTurn?.turnNumber,
      firstTurn?.state,
      firstTurn?.requestCount,
      firstTurn?.write,
      firstTurn?.thinking,
    ].join('|');
    const renderKey = makeRenderKey();

    if (container._renderKey === renderKey) {
      const sDurNode = container.querySelector('[data-hist-live="sessionDur"]');
      if (sDurNode && sDurNode.textContent !== durStr) sDurNode.textContent = durStr;
      const sItemNode = container.querySelector('[data-hist-live="sessionItem"]');
      if (sItemNode) sItemNode.title = `${labels.sessionTime}: ${durStr}\n${labels.modelTime}: ${modelDurStr}`;
      if (activeTab === 'turns' && firstTurn && ['running', 'queued', 'unknown'].includes(firstTurn.state) && firstTurn.startedAtMs > 0) {
        const liveTurnDur = formatSessionSeconds(Math.max(0, (nowMs - firstTurn.startedAtMs) / 1000));
        const tNode = container.querySelector('[data-hist-live="turn0Dur"]');
        if (tNode) tNode.textContent = `${liveTurnDur} · ${firstTurn.requestCount ?? 0} ${labels.reqsUnit}`;
      }
      return;
    }

    const prevScroll = container.querySelector('.hist-list')?.scrollTop || 0;
    container._renderKey = renderKey;

    const avgStr = Number.isFinite(summary.avgTps) ? summary.avgTps.toFixed(1) + ' tok/s' : '—';
    const streamStr = Number.isFinite(summary.avgStreamTps) ? summary.avgStreamTps.toFixed(1) + ' tok/s' : '—';
    const peakTpsStr = Number.isFinite(summary.peakTps) ? summary.peakTps.toFixed(1) + ' tok/s' : '—';
    const peakCtxStr = formatTokens(summary.peakContextTokens || 0);
    const limitStr = maxLimit > 0 ? formatTokens(maxLimit) : '';
    const compactAt = summary.compactionThresholdTokens || 0;
    const compactStr = compactAt > 0 ? formatTokens(compactAt) : '';
    const totalSessionStr = summary.totalSessionTokens > 0 ? formatTokens(summary.totalSessionTokens) : '';
    const hitRateStr = Number.isFinite(summary.overallCacheHitRate) && summary.totalPromptTokens > 0 ? Math.round(summary.overallCacheHitRate) + '%' : '';

    const compBadge = summary.compactionCount > 0
      ? `<span class="hist-badge">${escapeHtml(labels.compactedBadge.replace('{n}', summary.compactionCount))}</span>`
      : '';

    const ctxSvg = buildContextSvg(requests, maxLimit, { width: 290, height: 66, showDots: true, compactionLimit: compactAt });
    const tpsSvg = buildTpsSvg(requests, summary.avgTps, { width: 290, height: 66, maxBars: 28 });

    const phaseLabelOf = phase => phase === 'plan' ? labels.phasePlan : phase === 'execute' ? labels.phaseExec : labels.phaseDirect;
    const effortLabelOf = effort => effort === 'auto' ? labels.effortAuto : (effort || '');

    const listRows = activeTab === 'turns'
      ? turns.slice(0, 25).map((turn, idx) => {
          const turnDur = ['running', 'queued', 'unknown'].includes(turn.state) && turn.startedAtMs > 0
            ? formatSessionSeconds(Math.max(0, (nowMs - turn.startedAtMs) / 1000))
            : formatSessionSeconds(turn.duration);
          const tps = Number.isFinite(turn.avgTps) ? turn.avgTps.toFixed(1) + ' tok/s' : '—';
          const usedTags = Array.isArray(turn.modelsUsed) && turn.modelsUsed.length > 0
            ? turn.modelsUsed.map(m => m.isOrchestrator ? `${phaseLabelOf(m.phase)}·${m.shortName}` : `${m.shortName}${m.effort ? '·' + effortLabelOf(m.effort) : ''}`).join(' → ')
            : '';
          const thinkWrite = `${labels.think} ${formatTokens(turn.thinking)} · ${labels.write} ${formatTokens(turn.write)}`;
          const tipParts = [thinkWrite];
          if (usedTags) tipParts.unshift(`${labels.routingSummary}: ${usedTags}`);
          if (Number.isFinite(turn.avgStreamTps)) tipParts.push(`${labels.streamSpeed}: ${turn.avgStreamTps.toFixed(1)} tok/s · ${labels.avgSpeed}: ${tps}`);
          const streamTip = ` title="${escapeHtml(tipParts.join('\n'))}"`;
          const liveAttr = idx === 0 ? ' data-hist-live="turn0Dur"' : '';
          const isExpanded = expandedTurns.has(turn.turnNumber);
          return `<div class="hist-turn-item">`
            + `<button type="button" class="hist-row hist-row-turn" data-hist-turn="${turn.turnNumber}" aria-expanded="${isExpanded ? 'true' : 'false'}"${streamTip}>`
            + `<span class="hist-id">#${turn.turnNumber}</span>`
            + `<span class="hist-cell"${liveAttr}>${escapeHtml(turnDur)} · ${turn.requestCount ?? 0} ${escapeHtml(labels.reqsUnit)}</span>`
            + `<span class="hist-right">${escapeHtml(tps)}<span class="hist-turn-chev" aria-hidden="true">▾</span></span>`
            + `</button>`
            + `<div class="hist-turn-detail" data-hist-turn-detail="${turn.turnNumber}"${isExpanded ? '' : ' hidden'}>`
            + `<div class="hist-turn-detail-line"><span>${escapeHtml(thinkWrite)}</span>${Number.isFinite(turn.avgStreamTps) ? `<span>${escapeHtml(labels.streamSpeed)} ${turn.avgStreamTps.toFixed(1)} tok/s</span>` : ''}</div>`
            + (usedTags ? `<div class="hist-turn-detail-sub">${escapeHtml(usedTags)}</div>` : '')
            + `</div>`
            + `</div>`;
        }).join('')
      : [...requests].reverse().slice(0, 40).map(req => {
          const tps = Number.isFinite(req.tps) ? req.tps.toFixed(1) + ' tok/s' : '—';
          const color = speedTierColor(req.tps);
          const timing = Number.isFinite(req.ttft) && Number.isFinite(req.duration) ? `${req.ttft.toFixed(1)}s–${req.duration.toFixed(1)}s` : '—';
          const mBadge = req.modelShort
            ? `<span class="hist-mtag" data-phase="${escapeHtml(req.modelPhase || 'direct')}">${escapeHtml(`${req.modelShort}${req.modelEffort && req.modelEffort !== 'auto' ? '·' + effortLabelOf(req.modelEffort) : ''}`)}</span>`
            : '';
          const tipLines = [];
          if (req.modelName) tipLines.push(`${labels.stepModel}: ${req.modelName}${req.modelEffort ? ' · ' + labels.effortLabel + ': ' + effortLabelOf(req.modelEffort) : ''}`);
          if (Number.isFinite(req.streamTps)) tipLines.push(`${labels.streamSpeed}: ${req.streamTps.toFixed(1)} tok/s · TTFT ${timing}`);
          else tipLines.push(`TTFT ${timing}`);
          if (Number.isFinite(req.thinking)) tipLines.push(`${labels.think}: ${formatTokens(req.thinking)} · ${labels.reply}: ${formatTokens(req.reply)}`);
          const streamTip = ` title="${escapeHtml(tipLines.join('\n'))}"`;
          const isExpanded = expandedReqs.has(req.requestIndex);
          const hasReplyOrThink = Number.isFinite(req.thinking) || Number.isFinite(req.reply);
          const detailLeft = hasReplyOrThink
            ? `<span>${escapeHtml(labels.think)} ${formatTokens(req.thinking)} · ${escapeHtml(labels.reply)} ${formatTokens(req.reply)}</span><span>TTFT ${escapeHtml(timing)}</span>`
            : `<span>TTFT ${escapeHtml(timing)}</span>`;
          const subParts = [];
          if (req.modelName) subParts.push(req.modelName);
          if (Number.isFinite(req.streamTps)) subParts.push(`${labels.streamSpeed} ${req.streamTps.toFixed(1)} tok/s`);
          return `<div class="hist-turn-item">`
            + `<button type="button" class="hist-row hist-row-req" data-hist-req="${req.requestIndex}" aria-expanded="${isExpanded ? 'true' : 'false'}"${streamTip}>`
            + `<span class="hist-id">#${req.requestIndex + 1}</span>`
            + `<span class="hist-cell">${mBadge || `TTFT ${escapeHtml(timing)}`}</span>`
            + `<span class="hist-ctx">${formatTokens(req.contextTokens)}</span>`
            + `<span class="hist-right" style="color:${color}">${escapeHtml(tps)}<span class="hist-turn-chev" aria-hidden="true">▾</span></span>`
            + `</button>`
            + `<div class="hist-turn-detail" data-hist-req-detail="${req.requestIndex}"${isExpanded ? '' : ' hidden'}>`
            + `<div class="hist-turn-detail-line">${detailLeft}</div>`
            + (subParts.length ? `<div class="hist-turn-detail-sub">${escapeHtml(subParts.join(' · '))}</div>` : '')
            + `</div>`
            + `</div>`;
        }).join('');

    const sessionVal = `${summary.turnCount || 0} / ${summary.requestCount || requests.length}${totalSessionStr ? ' · ' + totalSessionStr : ''}`;
    const sessionTip = `${summary.turnCount || 0} ${labels.turnsUnit} / ${summary.requestCount || requests.length} ${labels.reqsUnit}${totalSessionStr ? `\n${labels.totalUsage}: ${totalSessionStr} tokens` : ''}${hitRateStr ? ` · ${labels.cache}: ${hitRateStr}` : ''}`;
    const speedTip = `${labels.avgSpeed}: ${avgStr} (${labels.peakSpeed} ${peakTpsStr})\n${labels.streamSpeed}: ${streamStr}`;
    const peakCtxVal = limitStr ? `${peakCtxStr} / ${limitStr}` : peakCtxStr;
    const peakCtxTip = `${labels.peakCtx}: ${peakCtxVal}${compactStr && compactStr !== limitStr ? `\n${labels.autoCompactAt}: ${compactStr}` : ''}`;
    const ctxMeta = compactStr && compactStr !== limitStr
      ? `${labels.peakCtx} ${peakCtxStr} · ${labels.autoCompactAt} ${compactStr}`
      : `${labels.peakCtx} ${peakCtxVal}`;
    const speedMeta = streamStr !== '—'
      ? `${labels.streamSpeed} ${streamStr} · ${labels.peakSpeed} ${peakTpsStr}`
      : `${labels.peakSpeed} ${peakTpsStr}`;

    container.innerHTML = `<div class="hist-head"><span class="quota-group-title">${escapeHtml(labels.trendsSection)}</span>${compBadge}</div>`
      + `<div class="hist-kpi-grid">`
      + `<div class="hist-kpi-item" data-hist-live="sessionItem" title="${escapeHtml(`${labels.sessionTime}: ${durStr}\n${labels.modelTime}: ${modelDurStr}`)}"><span class="hist-kpi-line"></span><div class="hist-kpi-body"><span class="hist-kpi-label">${escapeHtml(labels.sessionTime)}</span><span class="hist-kpi-val" data-hist-live="sessionDur">${escapeHtml(durStr)}</span></div></div>`
      + `<div class="hist-kpi-item" title="${escapeHtml(sessionTip)}"><span class="hist-kpi-line"></span><div class="hist-kpi-body"><span class="hist-kpi-label">${escapeHtml(labels.sessionTotal)}</span><span class="hist-kpi-val">${escapeHtml(sessionVal)}</span></div></div>`
      + `<div class="hist-kpi-item" title="${escapeHtml(speedTip)}"><span class="hist-kpi-line"></span><div class="hist-kpi-body"><span class="hist-kpi-label">${escapeHtml(labels.avgSpeed)} / ${escapeHtml(labels.streamSpeed)}</span><span class="hist-kpi-val">${escapeHtml(avgStr)}${streamStr !== '—' ? ' · ' + escapeHtml(streamStr.replace(' tok/s', '')) : ''}</span></div></div>`
      + `<div class="hist-kpi-item" title="${escapeHtml(peakCtxTip)}"><span class="hist-kpi-line"></span><div class="hist-kpi-body"><span class="hist-kpi-label">${escapeHtml(labels.peakCtx)}</span><span class="hist-kpi-val">${escapeHtml(peakCtxVal)}</span></div></div>`
      + `</div>`
      + `<div class="hist-charts-grid">`
      + `<div class="hist-chart-card"><div class="hist-chart-top"><span>${escapeHtml(labels.contextTrend)}</span><span class="hist-chart-meta">${escapeHtml(ctxMeta)}</span></div>${ctxSvg || `<div class="hist-empty">${escapeHtml(labels.noHistory)}</div>`}</div>`
      + `<div class="hist-chart-card"><div class="hist-chart-top"><span>${escapeHtml(labels.speedTrend)}</span><span class="hist-chart-meta">${escapeHtml(speedMeta)}</span></div>${tpsSvg || `<div class="hist-empty">${escapeHtml(labels.noHistory)}</div>`}</div>`
      + `</div>`
      + `<div class="hist-tabs">`
      + `<button type="button" class="hist-tab" data-hist-tab="turns" data-active="${activeTab === 'turns'}">${escapeHtml(labels.turnHistoryTab)} (${turns.length})</button>`
      + `<button type="button" class="hist-tab" data-hist-tab="requests" data-active="${activeTab === 'requests'}">${escapeHtml(labels.reqHistoryTab)} (${requests.length})</button>`
      + `</div>`
      + `<div class="hist-list">${listRows || `<div class="hist-empty">${escapeHtml(labels.noHistory)}</div>`}</div>`;

    const listEl = container.querySelector('.hist-list');
    if (listEl && prevScroll > 0) listEl.scrollTop = prevScroll;

    for (const btn of container.querySelectorAll('[data-hist-tab]')) {
      btn.addEventListener('click', () => {
        container._histTab = btn.dataset.histTab;
        container._renderKey = '';
        renderSidebarHistory(container, history, maxLimit, labels, Date.now());
      });
    }
    for (const btn of container.querySelectorAll('[data-hist-turn]')) {
      btn.addEventListener('click', () => {
        const turnNum = Number(btn.dataset.histTurn);
        const nextOpen = !expandedTurns.has(turnNum);
        if (nextOpen) expandedTurns.add(turnNum);
        else expandedTurns.delete(turnNum);
        btn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        const detail = container.querySelector(`[data-hist-turn-detail="${turnNum}"]`);
        if (detail) detail.hidden = !nextOpen;
        container._renderKey = makeRenderKey();
      });
    }
    for (const btn of container.querySelectorAll('[data-hist-req]')) {
      btn.addEventListener('click', () => {
        const reqIdx = Number(btn.dataset.histReq);
        const nextOpen = !expandedReqs.has(reqIdx);
        if (nextOpen) expandedReqs.add(reqIdx);
        else expandedReqs.delete(reqIdx);
        btn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        const detail = container.querySelector(`[data-hist-req-detail="${reqIdx}"]`);
        if (detail) detail.hidden = !nextOpen;
        container._renderKey = makeRenderKey();
      });
    }
  }
  function parseComposerOrchestrator(footerModelText = '') {
    const raw = String(footerModelText || '').trim();
    if (!raw) return { known: false, isOrchestrator: false, plannerName: '', displayName: '', effort: '' };
    const match = /\borchestrator\b(?:\s*\(([^)]+)\))?/i.exec(raw);
    if (!match) return { known: true, isOrchestrator: false, plannerName: '', displayName: '', effort: '' };
    let plannerName = match[1] ? match[1].trim() : '';
    if (!plannerName) {
      if (/\bneon\b/i.test(raw)) plannerName = 'Neon';
      else if (/\bargon\b/i.test(raw)) plannerName = 'Argon';
      else if (/\bopus(?:\s*5\.5)?\b/i.test(raw)) plannerName = /opus\s*5\.5/i.test(raw) ? 'Opus 5.5' : 'Opus';
      else if (/\bcarbon\b/i.test(raw)) plannerName = 'Carbon';
      else plannerName = 'Orchestrator';
    } else if (/^claude\s+opus/i.test(plannerName)) {
      plannerName = plannerName.replace(/^claude\s+/i, '').trim();
    }
    const effortMatch = /\b(XHigh|Extra\s*High|Extra|High|Medium|Med|Low|Minimal|Max)\b/i.exec(raw);
    const effortMap = { xhigh: 'XHigh', extrahigh: 'XHigh', extra: 'XHigh', high: 'High', medium: 'Medium', med: 'Medium', low: 'Low', minimal: 'Minimal', max: 'Max' };
    const effort = effortMatch ? (effortMap[effortMatch[1].toLowerCase().replace(/\s+/g, '')] || '') : '';
    const displayName = plannerName && plannerName.toLowerCase() !== 'orchestrator'
      ? `Orchestrator (${plannerName})${effort ? ` (${effort})` : ''}`
      : `Orchestrator${effort ? ` (${effort})` : ''}`;
    return { known: true, isOrchestrator: true, plannerName, displayName, effort };
  }
  function plannerMatchesName(stepShort = '', composerPlanner = '') {
    const a = String(stepShort || '').trim().toLowerCase();
    const b = String(composerPlanner || '').trim().toLowerCase();
    if (!b || b === 'orchestrator') return true;
    if (a === b) return true;
    // Handle 'Opus' matching 'Opus 5.5' and vice versa.
    return a.startsWith(b) || b.startsWith(a);
  }
  function resolveActiveOrchestratorModel(stepModel, footerModelText = '') {
    const composer = parseComposerOrchestrator(footerModelText);
    if (composer.known) {
      if (!composer.isOrchestrator) return null;
      const lastPlannerEntry = Array.isArray(stepModel?.modelBreakdown)
        ? [...stepModel.modelBreakdown].reverse().find(b => b.isOrchestrator && b.phase === 'plan')
        : null;
      const effortMatches = (stepEff) => !composer.effort || stepEff === composer.effort;
      const matchesActive = stepModel?.isOrchestrator && (
        (stepModel.phase === 'execute' && (
          stepModel.liveRunning ||
          !lastPlannerEntry ||
          (plannerMatchesName(lastPlannerEntry.shortName, composer.plannerName) && effortMatches(lastPlannerEntry.effort))
        )) ||
        (stepModel.phase === 'plan' &&
          plannerMatchesName(stepModel.shortName, composer.plannerName) &&
          effortMatches(stepModel.effort))
      );
      if (matchesActive) return stepModel;
      const allBreakdown = Array.isArray(stepModel?.modelBreakdown)
        ? stepModel.modelBreakdown
        : [];
      return {
        modelNum: 0,
        modelId: '',
        displayName: composer.displayName,
        shortName: composer.plannerName,
        isOrchestrator: true,
        phase: 'plan',
        effort: composer.effort || 'auto',
        workerModelNum: 0,
        sessionUsesOrchestrator: true,
        liveRunning: false,
        readyPending: true,
        stepThinkingTokens: null,
        stepReplyTokens: null,
        stepOutputTokens: null,
        thinkingRatio: null,
        thinkingDurationSec: null,
        stepDurationSec: null,
        modelBreakdown: allBreakdown,
      };
    }
    return stepModel?.isOrchestrator ? stepModel : null;
  }
  function stepModelView(stepModel, t = dictionaries.en) {
    if (!stepModel || !stepModel.shortName) return null;
    const phaseLabel = stepModel.phase === 'plan' ? t.phasePlan : stepModel.phase === 'execute' ? t.phaseExec : t.phaseDirect;
    const effortLabel = stepModel.effort === 'auto' ? t.effortAuto : (stepModel.effort || '');
    const thinkVal = Number.isFinite(stepModel.stepThinkingTokens) && stepModel.stepThinkingTokens > 0
      ? formatTokens(stepModel.stepThinkingTokens)
      : '';
    const thinkDur = Number.isFinite(stepModel.thinkingDurationSec) && stepModel.thinkingDurationSec > 0
      ? stepModel.thinkingDurationSec.toFixed(1) + 's'
      : '';
    const pillMain = stepModel.shortName;
    const pillEffort = effortLabel
      ? (thinkVal ? `${effortLabel} ${thinkVal}` : effortLabel)
      : (thinkVal ? `${t.thinkShort}${thinkVal}` : '');
    return {
      phase: stepModel.phase || 'direct',
      phaseLabel,
      shortName: stepModel.shortName,
      displayName: stepModel.displayName || stepModel.shortName,
      modelId: stepModel.modelId || '',
      isOrchestrator: !!stepModel.isOrchestrator,
      sessionUsesOrchestrator: !!stepModel.sessionUsesOrchestrator,
      liveRunning: !!stepModel.liveRunning,
      readyPending: !!stepModel.readyPending,
      effort: stepModel.effort || '',
      effortLabel,
      thinkVal,
      thinkDur,
      thinkingRatio: stepModel.thinkingRatio,
      replyVal: Number.isFinite(stepModel.stepReplyTokens) ? formatTokens(stepModel.stepReplyTokens) : '',
      pillMain,
      pillEffort,
      breakdown: Array.isArray(stepModel.modelBreakdown) ? stepModel.modelBreakdown : [],
    };
  }
  function renderStepModelPopover(container, stepModel, t = dictionaries.en) {
    if (!container) return;
    const v = stepModelView(stepModel, t);
    if (!v) {
      container._modelPopKey = '';
      container.replaceChildren();
      return;
    }
    const key = JSON.stringify([v.phase, v.displayName, v.effortLabel, v.thinkVal, v.thinkDur, v.thinkingRatio, v.replyVal, v.liveRunning, v.readyPending, v.breakdown.length, v.breakdown.map(b => `${b.phase}:${b.shortName}:${b.effort}:${b.requests}:${b.thinkingTokens}`).join(','), t.stepModel]);
    if (container._modelPopKey === key) return;
    container._modelPopKey = key;

    const ratioPct = Number.isFinite(v.thinkingRatio) ? Math.max(0, Math.min(100, v.thinkingRatio)) : 0;
    const thinkSummary = v.thinkVal
      ? `${v.thinkVal}${Number.isFinite(v.thinkingRatio) ? ` (${v.thinkingRatio}%)` : ''}${v.thinkDur ? ` · ${v.thinkDur}` : ''}`
      : (v.readyPending ? t.readyNextTurn : v.liveRunning ? '…' : '—');
    const effortNote = v.effort === 'auto'
      ? `<div class="dk-model-note">${escapeHtml(t.effortAutoTip)}</div>`
      : '';
    const breakdownRows = v.breakdown.length > 0
      ? `<div class="dk-model-sep"></div><div class="dk-model-sec">${escapeHtml(t.routingSummary)}</div>`
        + v.breakdown.map(b => {
            const eLbl = b.effort === 'auto' ? t.effortAuto : (b.effort || '');
            const tag = `${b.shortName}${eLbl && b.effort !== 'auto' ? ' · ' + eLbl : ''}`;
            return `<div class="dk-model-brow">`
              + `<span class="dk-model-btag" data-phase="${escapeHtml(b.phase)}">${escapeHtml(tag)}</span>`
              + `<span class="dk-model-bmeta">${b.requests}${escapeHtml(t.stepsUnit)} · ${escapeHtml(t.thinkShort)}${formatTokens(b.thinkingTokens)}</span>`
              + `</div>`;
          }).join('')
      : '';

    container.innerHTML = `<div class="dk-panel-content">`
      + `<div class="dk-model-head"><span class="dk-model-phase" data-phase="${escapeHtml(v.phase)}">${escapeHtml(v.phaseLabel)}</span><span class="dk-model-name">${escapeHtml(v.displayName)}</span></div>`
      + (v.modelId ? `<div class="dk-model-slug">${escapeHtml(v.modelId)}</div>` : '')
      + `<div class="dk-model-kv"><span>${escapeHtml(t.effortLabel)}</span><span class="dk-model-val" data-effort="${escapeHtml(v.effort)}">${escapeHtml(v.effortLabel || '—')}</span></div>`
      + `<div class="dk-model-kv"><span>${escapeHtml(t.stepThinking)}</span><span class="dk-model-val">${escapeHtml(thinkSummary)}</span></div>`
      + (v.thinkVal && Number.isFinite(v.thinkingRatio)
          ? `<div class="dk-model-bar"><span style="width:${ratioPct}%"></span></div>`
          : '')
      + effortNote
      + breakdownRows
      + `</div>`;
  }
  function renderSidebarStepModel(container, stepModel, t = dictionaries.en, footerModelText = '') {
    if (!container) return;
    const activeModel = resolveActiveOrchestratorModel(stepModel, footerModelText);
    const v = stepModelView(activeModel, t);
    if (!v) {
      container.hidden = true;
      container._stepModelKey = '';
      container.replaceChildren();
      return;
    }
    container.hidden = false;
    const key = JSON.stringify([v.phase, v.displayName, v.effortLabel, v.thinkVal, v.thinkDur, v.thinkingRatio, v.liveRunning, v.readyPending, v.breakdown.map(b => `${b.phase}:${b.shortName}:${b.effort}:${b.requests}:${b.thinkingTokens}`).join(','), t.stepModel]);
    if (container._stepModelKey === key) return;
    container._stepModelKey = key;

    const thinkMeta = v.thinkVal
      ? `${t.thinkShort} ${v.thinkVal}${Number.isFinite(v.thinkingRatio) ? ` (${v.thinkingRatio}%)` : ''}${v.thinkDur ? ` · ${v.thinkDur}` : ''}`
      : (v.readyPending ? t.readyNextTurn : '');
    const breakdownHtml = v.breakdown.length > 0
      ? `<div class="model-routing-row">${v.breakdown.map(b => {
          const eLbl = b.effort === 'auto' ? t.effortAuto : (b.effort || '');
          const label = `${b.shortName}${eLbl && b.effort !== 'auto' ? '·' + eLbl : ''}`;
          return `<span class="model-route-chip" data-phase="${escapeHtml(b.phase)}" title="${escapeHtml(`${b.displayName}: ${b.requests} ${t.stepsUnit} · ${t.think} ${formatTokens(b.thinkingTokens)} · ${t.reply} ${formatTokens(b.replyTokens)}`)}">${escapeHtml(label)} <b>${b.requests}${escapeHtml(t.stepsUnit)}</b></span>`;
        }).join('')}</div>`
      : '';

    const tip = `${t.stepModel}: ${v.displayName}${v.modelId ? ` (${v.modelId})` : ''}\n${t.effortLabel}: ${v.effortLabel || '—'}${v.effort === 'auto' ? ' — ' + t.effortAutoTip : ''}${thinkMeta ? `\n${t.stepThinking}: ${thinkMeta}` : ''}`;
    container.title = tip;
    container.innerHTML = `<div class="model-step-top">`
      + `<div class="model-step-left"><span class="model-phase-pill" data-phase="${escapeHtml(v.phase)}">${escapeHtml(v.phaseLabel)}</span><span class="model-step-name">${escapeHtml(v.shortName)}</span>${v.effortLabel ? `<span class="model-effort-pill" data-effort="${escapeHtml(v.effort)}">${escapeHtml(v.effortLabel)}</span>` : ''}</div>`
      + (thinkMeta ? `<span class="model-step-think">${escapeHtml(thinkMeta)}</span>` : '')
      + `</div>`
      + breakdownHtml;
  }
  return { version: 72, dictionaries, locale, systemLocale, apply, appearance, formatReset, escapeHtml, formatTokens, cacheTooltip, cacheView, contextTooltips, renderContextTooltips, quotaTooltip, applyQuotaTooltips, alertView, renderAlerts, generationText, generationMarkup, renderGeneration, historyMarkup, renderHistory, renderSidebarHistory, parseComposerOrchestrator, resolveActiveOrchestratorModel, stepModelView, renderStepModelPopover, renderSidebarStepModel, ...turnMethods };
}

export const getPresentationScript = () => `if (globalThis.__agyPrismPresentation?.version !== 72) globalThis.__agyPrismPresentation = (${createPresentation.toString()})(${createTurnPresentation.toString()});`;
