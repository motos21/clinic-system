// 必要な部品をインポートします
const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const line = require("@line/bot-sdk");

// Firebase Admin SDK と LINE SDK を初期化します
initializeApp();
const db = getFirestore();

// あなたのチャネルアクセストークン
const lineConfig = {
  channelAccessToken: "Xj9gXP9FePdospdkjz30fcr4z9DXrpVVRFmcplOAO+i9W3Ji1vbzwyVGrHBIxugPGqmxfN6vbYLxWnpZXSeyaU8tei6a+o0AOMkUXszyD/HKQPrbDwUvYBfwTFuSZLHpJJtPnQl0CWRD0B82egPSfwdB04t89/1O/w1cDnyilFU="
};
const lineClient = new line.Client(lineConfig);

// スケジュールを計算する共通関数
function calculateSchedule(patient) {
    const schedule = [];
    const totalStages = parseInt(patient.totalStages, 10);
    const startDate = new Date(patient.startDate);
    const defaultInterval = patient.exchangeInterval || 7;
    const missedDays = patient.missedDays || 0;
    const overrides = patient.stageOverrides || {};
    let cumulativeDays = 0;
    for (let i = 1; i <= totalStages; i++) {
        const interval = overrides[String(i)] ? parseInt(overrides[String(i)], 10) : defaultInterval;
        cumulativeDays += interval;
        const exchangeDate = new Date(startDate);
        exchangeDate.setDate(startDate.getDate() + cumulativeDays + missedDays);
        schedule.push({ stage: i, exchangeDate: exchangeDate });
    }
    return schedule;
}

/**
 * HTTPトリガーで起動し、通知チェックを行う関数
 */
exports.dailyNotificationTrigger = onRequest({
    region: "asia-northeast1",
    timeoutSeconds: 300,
}, async (request, response) => {
  logger.info("HTTP経由で自動通知チェックを開始します。");

  try {
    const snapshot = await db.collection("patients").get();
    const patients = snapshot.docs.map(doc => doc.data());

    // 明日の日付を準備（時刻をリセットして日付のみで比較）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const promises = [];

    patients.forEach(patient => {
      // 必要な情報が揃っている患者さんのみが対象
      if (patient.lineUserId && patient.startDate && patient.totalStages) {
        
        // ★★★ 最新のロジックでスケジュールを計算 ★★★
        const schedule = calculateSchedule(patient);

        // スケジュールの中から、交換日が「明日」に一致するものを探す
        const notificationTarget = schedule.find(item => {
            const exchangeDate = new Date(item.exchangeDate);
            exchangeDate.setHours(0, 0, 0, 0);
            return exchangeDate.getTime() === tomorrow.getTime();
        });

        // もし通知対象が見つかったら
        if (notificationTarget) {
          const nextStage = notificationTarget.stage + 1;
          logger.info(`通知対象者を発見: ${patient.name}さん (ステージ${nextStage}へ)`);
          
          const message = {
            type: "text",
            text: `${patient.name}様\n明日はマウスピースの交換日です！\n新しいステージ（${nextStage}枚目）に進む準備をしましょう。`
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