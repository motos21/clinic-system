// 必要な部品をインポート（読み込み）します
const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
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
    region: "asia-northeast1",
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
        const missedDays = patient.missedDays || 0; // つけ忘れ日数を取得

        // JSTでの日付の差を正しく計算するために、時刻をリセット
        const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = todayOfDay - startOfDay;
        const totalElapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 経過日数
        
        // ★★★ ここが核心のロジック ★★★
        // 有効な治療日数 = 経過日数 - つけ忘れ日数
        const effectiveDays = totalElapsedDays - missedDays;
        
        // 交換日かどうかをチェック（交換日の前日に通知）
        if ((effectiveDays + 1) % patient.exchangeInterval === 0 && effectiveDays >= 0) {
          
          const stage = Math.floor(effectiveDays / patient.exchangeInterval) + 1;
          logger.info(`通知対象者を発見: ${patient.name}さん (ステージ${stage}を完了)`);
          
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
        const message = `${promises.length}件の通知を送信しました。`;
        logger.info(message);
        response.send(message);
    } else {
        const message = "本日の通知対象者はいませんでした。";
        logger.info(message);
        response.send(message);
    }

  } catch (error) {
    logger.error("自動通知処理中にエラーが発生しました:", error);
    response.status(500).send("エラーが発生しました。");
  }
});