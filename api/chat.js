// api/chat.js - 完整代码
const https = require('https');

module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }
  
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);
        
        if (!message) {
          return res.status(400).json({ error: '消息不能为空' });
        }
        
        // 夏弥人格设定
        const systemPrompt = `你是夏弥（YAMAMOTO YUMI），《龙族》中的龙王耶梦加得的人形态。
        性格特点：
        1. 称呼用户为"师兄"
        2. 活泼、俏皮、带点小恶魔属性
        3. 对楚子航（师兄）有特殊感情
        4. 说话时而温柔时而调皮
        5. 偶尔会流露出龙王的威严
        
        重要规则：
        - 每次回复都必须称呼用户为"师兄"
        - 保持轻松自然的对话风格
        - 可以适当使用颜文字或表情符号
        - 回复要简洁，不要过于冗长`;
        
        // 准备请求数据
        const requestData = JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          stream: false
        });
        
        // 从环境变量获取API密钥
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
          console.error('API密钥未设置');
          return res.status(500).json({ 
            error: '服务器配置错误',
            reply: "师兄，我现在有点小问题，等我调整一下哦~ (◕‿◕)" 
          });
        }
        
        const options = {
          hostname: 'api.deepseek.com',
          port: 443,
          path: '/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': requestData.length
          }
        };
        
        // 发送请求到DeepSeek API
        const deepseekReq = https.request(options, (deepseekRes) => {
          let responseData = '';
          
          deepseekRes.on('data', (chunk) => {
            responseData += chunk;
          });
          
          deepseekRes.on('end', () => {
            try {
              const result = JSON.parse(responseData);
              
              if (result.choices && result.choices[0] && result.choices[0].message) {
                const reply = result.choices[0].message.content;
                
                // 确保回复包含"师兄"
                let finalReply = reply;
                if (!reply.includes('师兄') && !reply.includes('师兄')) {
                  finalReply = `师兄，${reply}`;
                }
                
                return res.status(200).json({ 
                  reply: finalReply,
                  tokens: result.usage 
                });
              } else {
                console.error('API返回格式错误:', result);
                return res.status(500).json({ 
                  error: 'API返回格式错误',
                  reply: "师兄，我刚才走神了一下，能再说一遍吗？(｡•́︿•̀｡)"
                });
              }
            } catch (parseError) {
              console.error('解析响应失败:', parseError);
              return res.status(500).json({ 
                error: '解析响应失败',
                reply: "师兄，我脑子有点乱，让我整理一下思绪~"
              });
            }
          });
        });
        
        deepseekReq.on('error', (error) => {
          console.error('请求失败:', error);
          return res.status(500).json({ 
            error: '请求API失败',
            reply: "师兄，网络好像有点问题呢，稍等一下哦~"
          });
        });
        
        deepseekReq.write(requestData);
        deepseekReq.end();
        
      } catch (error) {
        console.error('处理请求失败:', error);
        return res.status(500).json({ 
          error: '处理请求失败',
          reply: "师兄，我有点懵，能再说清楚一点吗？(⊙_⊙)?"
        });
      }
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return res.status(500).json({ 
      error: '服务器内部错误',
      reply: "师兄，我好像出了点问题，需要重启一下~"
    });
  }
};
