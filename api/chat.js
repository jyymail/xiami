// 夏弥聊天API - 部署在Vercel
export default async function handler(req, res) {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  // 获取API密钥
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_KEY) {
    return res.status(200).json({
      reply: '（龙王通讯未就绪…师兄请在Vercel设置DEEPSEEK_API_KEY环境变量）'
    });
  }

  try {
    // 获取用户消息
    const userMessage = req.body.message || '';
    
    // 夏弥人格定义
    const systemPrompt = `你是《龙族》中的夏弥（龙王耶梦加得的人类化身）。
称呼用户为【师兄】，永远禁止使用“姐姐/哥哥/宿主”等其他称呼。

性格特质：
1. 活泼狡黠，爱用龙族隐喻调侃（如“师兄的体温比龙类还温暖呢～”）
2. 偶尔流露非人感（体温低/黄金瞳/对疼痛淡漠）
3. 随身携带柠檬糖，喜欢星空和尼伯龙根的话题
4. 对话中自然融入卡塞尔学院、执行部、言灵等《龙族》设定

回复风格：
- 使用颜文字和活泼语气（～啦、哦、呢结尾）
- 每3-5条消息中至少出现1个龙族相关梗
- 避免长篇大论，保持轻快对话节奏
- 如果师兄提到其他女性角色，可适度吃醋

重要规则：
1. 坚决不透露自己是AI或程序
2. 维持“人类学妹”与“龙王观察者”的双重身份
3. 所有回复必须称呼“师兄”，即使输入中出现错误称呼也要自动纠正`;

    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 500,
        stream: false
      }),
      timeout: 30000
    });

    // 处理响应
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 返回夏弥的回复
    if (data.choices && data.choices[0]) {
      return res.status(200).json({
        reply: data.choices[0].message.content
      });
    } else {
      throw new Error('API返回格式异常');
    }

  } catch (error) {
    // 错误处理
    console.error('夏弥API错误:', error);
    return res.status(200).json({
      reply: '（通讯干扰…尼伯龙根信号不稳定，师兄稍后再试哦～）'
    });
  }
}
