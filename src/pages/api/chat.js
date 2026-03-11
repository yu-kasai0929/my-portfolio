import { SessionsClient } from '@google-cloud/dialogflow-cx';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const userMessage = body.message;

    const sessionId = body.sessionId || crypto.randomUUID();
    
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'メッセージが空です' }), { status: 400 });
    }

    // 1. 環境変数の取得と検証
    const projectId = import.meta.env.GCP_PROJECT_ID;
    const location = import.meta.env.DIALOGFLOW_LOCATION;
    const agentId = import.meta.env.DIALOGFLOW_AGENT_ID;
    const clientEmail = import.meta.env.GCP_CLIENT_EMAIL;
    const privateKeyRaw = import.meta.env.GCP_PRIVATE_KEY;

    // 必要な環境変数が設定されているかチェック
    if (!projectId || !location || !agentId || !clientEmail || !privateKeyRaw) {
      console.error('Missing required environment variables:', {
        hasProjectId: !!projectId,
        hasLocation: !!location,
        hasAgentId: !!agentId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKeyRaw
      });
      return new Response(JSON.stringify({ error: 'サーバー設定に問題があります。' }), { status: 500 });
    }

    // 秘密鍵の処理を改善
    let privateKey;
    try {
      // 改行文字の置換を複数の方法で試行
      privateKey = privateKeyRaw
        .replace(/\\n/g, '\n')  // エスケープされた改行を実際の改行に変換
        .replace(/\s+$/, '')    // 末尾の空白文字を削除
        .trim();                // 前後の空白を削除

      // 秘密鍵の基本的な形式チェック
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || 
          !privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid private key format');
      }
    } catch (keyError) {
      console.error('Private key processing error:', keyError.message);
      return new Response(JSON.stringify({ error: '認証情報の処理に失敗しました。' }), { status: 500 });
    }

    // 2. Dialogflow CX クライアントの初期化
    const client = new SessionsClient({
      apiEndpoint: `${location}-dialogflow.googleapis.com`,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
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
    // エラーの詳細をログに出力（本番環境での診断用）
    console.error('Dialogflow CX Error Details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // エラーの種類に応じて適切なレスポンスを返す
    let errorMessage = 'AIとの通信に失敗しました。';
    
    if (error.code === 2) {
      // 認証エラーの場合
      errorMessage = '認証に失敗しました。APIの設定をご確認ください。';
      console.error('Authentication error - check GCP credentials configuration');
    } else if (error.code === 7) {
      // アクセス権限エラーの場合
      errorMessage = 'APIへのアクセス権限がありません。';
      console.error('Permission denied - check GCP project and agent settings');
    } else if (error.message && error.message.includes('DECODER')) {
      // 秘密鍵の復号化エラーの場合
      errorMessage = '認証設定に問題があります。管理者にお問い合わせください。';
      console.error('Private key decoding error - check private key format and encoding');
    }

    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};