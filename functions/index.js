// 最新版（v2）の書き方で、HTTP関数とロガーをインポートします
const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
// FirestoreやLINEと会話するための部品をインポートします
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const line = require("@line/bot-sdk");

// Firebase Admin SDK と LINE SDK を初期化します
initializeApp();
const db = getFirestore();

// ▼▼▼ あなたのチャネルアクセストークンをここに貼り付けてください ▼▼▼
const lineConfig = {
  channelAccessToken: "Xj9gXP9FePdospdkjz30fcr4z9DXrpVVRFmcplOAO+i9W3Ji1vbzwyVGrHBIxugPGqmxfN6vbYLxWnpZXSeyaU8tei6a+o0AOMkUXszyD/HKQPrbDwUvYBfwTFuSZLHpJJtPnQl0CWRD0B82egPSfwdB04t89/1O/w1cDnyilFU="
};
const lineClient = new line.Client(lineConfig);


/**
 * この関数は、専用のURLにアクセスされると実行されます
 */
exports.dailyNotificationTrigger = onRequest({
    region: "asia-northeast1", // 東京リージョンで実行
    timeoutSeconds: 300,      // タイムアウトを5分に設定
}, async (request, response) => {
  logger.info("HTTP経由で自動通知チェックを開始します。");

  try {
    // 1. Firestoreから全患者データを取得
    const snapshot = await db.collection("patients").get();
    const patients = snapshot.docs.map(doc => doc.data());

    // 2. 通知を送るべき患者さんを見つけるための準備
    const today = new Date(); // 現在の日付を取得
    const promises = []; // 通知を送る処理を一時的に入れておくための箱

    // 3. 全ての患者さんを一人ずつチェック
    patients.forEach(patient => {
      // 必要な情報が揃っている患者さんのみが対象
      if (patient.lineUserId && patient.startDate && patient.exchangeInterval) {
        
        const startDate = new Date(patient.startDate);
        
        // JSTでの日付の差を正しく計算するために、時刻をリセット
        const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = todayOfDay - startOfDay;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 経過日数（0から始まる）
        
        // 交換日かどうかをチェック（例: 7日交換の場合、6日目、13日目、20日目...に通知）
        // (経過日数 + 1) が交換日数の倍数になる日の前日に通知
        if ((diffDays + 1) % patient.exchangeInterval === 0) {
          
          const stage = Math.floor(diffDays / patient.exchangeInterval) + 1;
          logger.info(`通知対象者を発見: ${patient.name}さん (ステージ${stage}を完了)`);
          
          // 通知メッセージを作成
          const message = {
            type: "text",
            text: `${patient.name}様\n明日はマウスピースの交換日です！\n新しいステージ（${stage + 1}枚目）に進む準備をしましょう。`
          };
          
          // LINEに通知を送る処理を、一時的な箱に追加
          promises.push(lineClient.pushMessage(patient.lineUserId, message));
        }
      }
    });

    // 4. 通知対象者全員に、一斉に通知を送信
    if (promises.length > 0) {
        await Promise.all(promises);
        const message = `${promises.length}件の通知を送信しました。`;
        logger.info(message);
        response.send(message); // ブラウザ画面にも結果を表示
    } else {
        const message = "本日の通知対象者はいませんでした。";
        logger.info(message);
        response.send(message); // ブラウザ画面にも結果を表示
    }

  } catch (error) {
    logger.error("自動通知処理中にエラーが発生しました:", error);
    response.status(500).send("エラーが発生しました。"); // ブラウザ画面にエラーを返す
  }
});