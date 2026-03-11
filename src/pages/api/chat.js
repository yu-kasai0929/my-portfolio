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
    
    // 秘密鍵の取得と前処理（Vercel環境変数設定の問題に対応）
    let privateKeyRaw = import.meta.env.GCP_PRIVATE_KEY;
    
    // ダブルクォートと他の環境変数を除去
    if (privateKeyRaw) {
      // 先頭と末尾のダブルクォートを除去
      if (privateKeyRaw.startsWith('"') && privateKeyRaw.includes('"', 1)) {
        const endQuoteIndex = privateKeyRaw.indexOf('"', 1);
        privateKeyRaw = privateKeyRaw.substring(1, endQuoteIndex);
      }
      
      // 他の環境変数が混入している場合の対応
      if (privateKeyRaw.includes('\nDIALOGFLOW_LOCATION=') || 
          privateKeyRaw.includes('\nGCP_') || 
          privateKeyRaw.includes('\nPROJECT_ID=')) {
        const lines = privateKeyRaw.split('\n');
        const keyLines = [];
        let inKey = false;
        
        for (const line of lines) {
          if (line.trim().startsWith('-----BEGIN PRIVATE KEY-----')) {
            inKey = true;
          }
          if (inKey) {
            keyLines.push(line);
          }
          if (line.trim().startsWith('-----END PRIVATE KEY-----')) {
            break;
          }
          if (line.includes('=') && !inKey) {
            break; // 他の環境変数が見つかった場合は終了
          }
        }
        privateKeyRaw = keyLines.join('\n');
      }
    }

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

      // 複数の処理方法を試行
      let processedKeys = [];
      
      // 方法1: 標準的なエスケープ解除
      processedKeys.push({
        method: 'standard',
        key: privateKeyRaw
          .replace(/\\n/g, '\n')
          .replace(/\s+$/, '')
          .trim()
      });

      // 方法2: より厳密な置換 
      processedKeys.push({
        method: 'strict',
        key: privateKeyRaw
          .replace(/\\\\n/g, '\n')  // ダブルエスケープ対応
          .replace(/\\n/g, '\n')
          .replace(/\r\n/g, '\n')   // Windows改行対応
          .replace(/\r/g, '\n')     // Mac改行対応
          .trim()
      });

      // 方法3: Base64デコード試行（もし秘密鍵がBase64エンコードされている場合）
      if (!privateKeyRaw.includes('-----BEGIN') && privateKeyRaw.length > 100) {
        try {
          const decoded = Buffer.from(privateKeyRaw, 'base64').toString('utf8');
          if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
            processedKeys.push({
              method: 'base64decoded',
              key: decoded.trim()
            });
          }
        } catch (base64Error) {
          console.log('Base64 decode attempt failed:', base64Error.message);
        }
      }

      // 各処理方法で形式チェック
      let validKey = null;
      for (const processed of processedKeys) {
        if (processed.key.includes('-----BEGIN PRIVATE KEY-----') && 
            processed.key.includes('-----END PRIVATE KEY-----')) {
          
          // PEM形式の基本検証
          const lines = processed.key.split('\n');
          if (lines.length >= 3 && 
              lines[0].trim() === '-----BEGIN PRIVATE KEY-----' &&
              lines[lines.length - 1].trim() === '-----END PRIVATE KEY-----') {
            validKey = processed;
            break;
          }
        }
      }

      if (!validKey) {
        throw new Error(`Invalid private key format after all processing methods. Tried: ${processedKeys.map(p => p.method).join(', ')}`);
      }

      privateKey = validKey.key;

    } catch (keyError) {
      console.error('Private key processing error:', {
        message: keyError.message,
        originalKeyLength: privateKeyRaw?.length,
        originalKeyStart: privateKeyRaw?.substring(0, 100)
      });
      return new Response(JSON.stringify({ error: '認証情報の処理に失敗しました。' }), { status: 500 });
    }

    // 2. Dialogflow CX クライアントの初期化
    let client;
    try {
      client = new SessionsClient({
        apiEndpoint: `${location}-dialogflow.googleapis.com`,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        }
      });

    } catch (clientError) {
      console.error('Client initialization failed:', {
        message: clientError.message,
        stack: clientError.stack,
        name: clientError.name
      });
      return new Response(JSON.stringify({ error: 'AIサービスの初期化に失敗しました。' }), { status: 500 });
    }

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