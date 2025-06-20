// HTTP関数をインポートするために、onRequestを追加します
const {onRequest} = require("firebase-functions/v2/https"); 
const {logger} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const line = require("@line/bot-sdk");

// Firebase Admin SDK と LINE SDK を初期化します
initializeApp();
const db = getFirestore();

// あなたのチャネルアクセストークンをここに貼り付けてください
const lineConfig = {
  channelAccessToken: "ここに、あなたのチャネルアクセストークンを貼り付け"
};
const lineClient = new line.Client(lineConfig);


/**
 * ★★★ この関数は、専用のURLにアクセスされると実行されます ★★★
 */
exports.dailyNotificationTrigger = onRequest({ 
    region: "asia-northeast1",
    // タイムアウトを長めに設定（データが多い場合のため）
    timeoutSeconds: 300,
}, async (request, response) => {
  logger.info("HTTP経由で自動通知チェックを開始します。");

  try {
    const snapshot = await db.collection("patients").get();
    const patients = snapshot.docs.map(doc => doc.data());

    const today = new Date();
    const promises = [];

    patients.forEach(patient => {
      if (patient.lineUserId && patient.startDate && patient.exchangeInterval) {
        const startDate = new Date(patient.startDate);
        const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = todayOfDay - startOfDay;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if ((diffDays + 1) % patient.exchangeInterval === 0) {
          const stage = (diffDays + 1) / patient.exchangeInterval;
          logger.info(`通知対象者を発見: ${patient.name}さん (ステージ${stage}へ)`);
          
          const message = {
            type: "text",
            text: `${patient.name}様\n明日はマウスピースの交換日です！\n新しいステージ（${stage + 1}枚目）に進む準備をしましょう。`
          };
          
          promises.push(lineClient.pushMessage(patient.lineUserId, message));
        }
      }
    });

    if (promises.length > 0) {
        await Promise.all(promises);
        logger.info(`${promises.length}件の通知を送信しました。`);
        response.send(`${promises.length}件の通知を送信しました。`);
    } else {
        logger.info("本日の通知対象者はいませんでした。");
        response.send("本日の通知対象者はいませんでした。");
    }

  } catch (error) {
    logger.error("自動通知処理中にエラーが発生しました:", error);
    response.status(500).send("エラーが発生しました。");
  }
});