import { SessionsClient } from '@google-cloud/dialogflow-cx';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const userMessage = body.message;

    const sessionId = body.sessionId || crypto.randomUUID();
    
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'メッセージが空です' }), { status: 400 });
    }

    // 1. 環境変数の取得
    const projectId = import.meta.env.GCP_PROJECT_ID;
    const location = import.meta.env.DIALOGFLOW_LOCATION;
    const agentId = import.meta.env.DIALOGFLOW_AGENT_ID;

    // 2. Dialogflow CX クライアントの初期化
    const client = new SessionsClient({
      apiEndpoint: `${location}-dialogflow.googleapis.com`,
      credentials: {
        client_email: import.meta.env.GCP_CLIENT_EMAIL,
        private_key: import.meta.env.GCP_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
      }
    });

    // 3. セッションパスの生成
    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );

    // 4. エージェントへメッセージを送信
    const requestObj = {
      session: sessionPath,
      queryInput: {
        text: { text: userMessage },
        languageCode: 'ja',
      },
    };

    const [response] = await client.detectIntent(requestObj);

    // 5. エージェントからの回答を抽出
    let aiResponse = '';
    if (response.queryResult.responseMessages && response.queryResult.responseMessages.length > 0) {
      for (const message of response.queryResult.responseMessages) {
        if (message.text && message.text.text) {
          aiResponse += message.text.text[0] + '\n';
        }
      }
    } else {
      aiResponse = '申し訳ありません、現在回答を準備中です。';
    }

    return new Response(JSON.stringify({ reply: aiResponse.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dialogflow CX Error:', error);
    return new Response(JSON.stringify({ error: 'AIとの通信に失敗しました。' }), { status: 500 });
  }
};