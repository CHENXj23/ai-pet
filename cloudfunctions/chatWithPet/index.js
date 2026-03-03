// cloudfunctions/chatWithPet/index.js
const cloud = require('wx-server-sdk')
const fetch = require('node-fetch')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 【步骤 1】填入你刚才复制的阿里云 API Key
const AI_API_KEY = 'sk-2d3d0985c1c54c1b96bfdc51fffb069a' 

// 【步骤 2】阿里云通义千问的接口地址
const AI_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

exports.main = async (event, context) => {
  const { userMessage, petName } = event

  // 设定宠物性格
  const systemPrompt = `你是一只叫${petName}的可爱宠物狗。你性格活泼，喜欢用表情符号。请用简短、可爱的语气回答用户的问题。不要说自己是 AI，要始终扮演狗狗。`

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        // 【步骤 3】使用通义千问模型 (qwen-turbo 速度快且便宜/免费)
        model: "qwen-turbo", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    })

    const data = await response.json()
    
    if (data.choices && data.choices.length > 0) {
        return {
          success: true,
          reply: data.choices[0].message.content
        }
    } else {
        return {
            success: false,
            error: "AI 没有返回内容"
        }
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err.message
    }
  }
}