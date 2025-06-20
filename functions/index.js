// 必要な部品をインポート（読み込み）します
const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const line = require("@line/bot-sdk");

// Firebase Admin SDK と LINE SDK を初期化します
initializeApp();
const db = getFirestore();

// ★★★ あなたのチャネルアクセストークンをここに貼り付けてください ★★★
const lineConfig = {
  channelAccessToken: "Xj9gXP9FePdospdkjz30fcr4z9DXrpVVRFmcplOAO+i9W3Ji1vbzwyVGrHBIxugPGqmxfN6vbYLxWnpZXSeyaU8tei6a+o0AOMkUXszyD/HKQPrbDwUvYBfwTFuSZLHpJJtPnQl0CWRD0B82egPSfwdB04t89/1O/w1cDnyilFU="
};
const lineClient = new line.Client(lineConfig);


/**
 * このFunctionは、日本のタイムゾーンで、毎日朝8時に自動実行されます。
 */
exports.dailyNotificationCheck = functions.region("asia-northeast1")
    .pubsub.schedule("every day 08:00")
    .timeZone("Asia/Tokyo")
    .onRun(async (context) => {
      console.log("自動通知チェックを開始します。");

      try {
        // 1. Firestoreから全患者データを取得
        const snapshot = await db.collection("patients").get();
        const patients = snapshot.docs.map(doc => doc.data());

        // 2. 通知を送るべき患者さんを見つけるための準備
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // 明日の日付を取得
        const promises = []; // 通知を送る処理を一時的に入れておくための箱

        // 3. 全ての患者さんを一人ずつチェック
        patients.forEach(patient => {
          // lineUserIdが登録されている患者さんのみが対象
          if (patient.lineUserId && patient.startDate && patient.exchangeInterval) {
            const startDate = new Date(patient.startDate);
            const today = new Date();
            
            // 治療開始からの経過日数を計算
            const diffTime = today - startDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            // もし、経過日数が交換日数の倍数なら、明日が交換日（または今日が交換日）
            if (diffDays % patient.exchangeInterval === 0) {
              console.log(`通知対象者を発見: ${patient.name}さん (LINE ID: ${patient.lineUserId})`);
              
              // 通知メッセージを作成
              const message = {
                type: "text",
                text: `${patient.name}様\n明日はマウスピースの交換日です！新しいステージに進む準備をしましょう。`
              };
              
              // LINEに通知を送る処理を、一時的な箱に追加
              promises.push(lineClient.pushMessage(patient.lineUserId, message));
            }
          }
        });

        // 4. 通知対象者全員に、一斉に通知を送信
        await Promise.all(promises);
        console.log("全ての通知処理が完了しました。");

      } catch (error) {
        console.error("自動通知処理中にエラーが発生しました:", error);
      }
      
      return null;
    });