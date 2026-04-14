// 月間リクエスト数を追跡（インスタンス単位・コールドスタートでリセット）
let usageTracker = {
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  requestCount: 0,
  totalTokens: 0,
};

function resetIfNewMonth() {
  const now = new Date();
  if (usageTracker.month !== now.getMonth() || usageTracker.year !== now.getFullYear()) {
    usageTracker = {
      month: now.getMonth(),
      year: now.getFullYear(),
      requestCount: 0,
      totalTokens: 0,
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, userMessage } = req.body;

  if (!system || !userMessage) {
    return res.status(400).json({ error: "system and userMessage are required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  // --- 月額上限チェック ---
  const monthlyRequestLimit = parseInt(process.env.MONTHLY_REQUEST_LIMIT || "1000", 10);
  const monthlyTokenLimit = parseInt(process.env.MONTHLY_TOKEN_LIMIT || "0", 10); // 0 = 無制限

  resetIfNewMonth();

  if (usageTracker.requestCount >= monthlyRequestLimit) {
    return res.status(429).json({
      error: "月間リクエスト上限に達しました。来月まで利用をお待ちください。",
      usage: {
        requestCount: usageTracker.requestCount,
        requestLimit: monthlyRequestLimit,
        totalTokens: usageTracker.totalTokens,
      },
    });
  }

  if (monthlyTokenLimit > 0 && usageTracker.totalTokens >= monthlyTokenLimit) {
    return res.status(429).json({
      error: "月間トークン上限に達しました。来月まで利用をお待ちください。",
      usage: {
        requestCount: usageTracker.requestCount,
        totalTokens: usageTracker.totalTokens,
        tokenLimit: monthlyTokenLimit,
      },
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = data.content?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "No response from Claude" });
    }

    // トークン使用量を記録
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const tokensUsed = inputTokens + outputTokens;

    usageTracker.requestCount += 1;
    usageTracker.totalTokens += tokensUsed;

    return res.status(200).json({
      text,
      usage: {
        requestCount: usageTracker.requestCount,
        requestLimit: monthlyRequestLimit,
        totalTokens: usageTracker.totalTokens,
        tokenLimit: monthlyTokenLimit || null,
        tokensThisRequest: tokensUsed,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
