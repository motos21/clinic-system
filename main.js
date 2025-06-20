// ==================================================================
// グローバル変数定義
// ==================================================================
let db; 
let currentPatientDocId = null; // ★紐付けられた患者のドキュメントIDを保存する変数を追加

// ==================================================================
// Firebaseの初期化処理
// ==================================================================
try {
  const firebaseConfig = {
    apiKey: "AIzaSyCAPRwg5mGMh8LRqCbRmoYwzqK-Msevv1g",
    authDomain: "clinic-system-7a716.firebaseapp.com",
    projectId: "clinic-system-7a716",
    storageBucket: "clinic-system-7a716.appspot.com",
    messagingSenderId: "15021094859",
    appId: "1:15021094859:web:e33fd4e47813499051284e"
  };
  if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
  db = firebase.firestore();
  console.log("Firebaseの接続に成功しました！");
} catch (error) { console.error("Firebaseの接続に失敗しました:", error); }

// ==================================================================
// 管理者画面向けの処理 (変更なし)
// ==================================================================
// ... (この部分は変更がないので、お手元のコードのままでOKです) ...


// ==================================================================
// LIFF関連の処理 (★★★ここからが今回のメインの変更箇所★★★)
// ==================================================================
async function initializeLiff() {
  try {
    await liff.init({ liffId: "2007606450-pl2Dn7YW" });
    if (!liff.isLoggedIn()) { liff.login(); return; }
    
    const profile = await liff.getProfile();
    document.getElementById("user-id").textContent = profile.userId;

    const patientQuery = await db.collection("patients").where("lineUserId", "==", profile.userId).get();

    if (patientQuery.empty) {
      document.getElementById('initial-registration').style.display = 'block';
      document.getElementById('treatment-status').style.display = 'none';
    } else {
      document.getElementById('treatment-status').style.display = 'block';
      document.getElementById('initial-registration').style.display = 'none';
      
      const patientDoc = patientQuery.docs[0];
      currentPatientDocId = patientDoc.id; // ★ドキュメントIDを保存
      displayTreatmentStatus(patientDoc.data());
    }
  } catch (error) { console.error("LIFFの処理に失敗しました:", error); }
}

// 初回登録フォームの処理 (変更なし)
const registrationForm = document.getElementById("registration-form");
if (registrationForm) { /* ... */ }

// ★★★ ここから新しい処理 ★★★
// 「つけ忘れ報告」ボタンの処理
const reportButton = document.getElementById("report-missed-day-button");
if (reportButton) {
    reportButton.addEventListener("click", async () => {
        if (!currentPatientDocId) {
            alert("患者情報が見つかりません。");
            return;
        }

        // 確認ダイアログを表示
        if (!confirm("本当に『つけ忘れ』を記録しますか？この操作は取り消せません。")) {
            return; // キャンセルされたら何もしない
        }

        try {
            const patientRef = db.collection("patients").doc(currentPatientDocId);
            
            // 現在のつけ忘れ日数を取得し、1増やす
            const patientDoc = await patientRef.get();
            const currentMissedDays = patientDoc.data().missedDays || 0;
            const newMissedDays = currentMissedDays + 1;

            // Firestoreのデータを更新
            await patientRef.update({
                missedDays: newMissedDays
            });
            
            // 画面の表示を更新
            const updatedPatientDoc = await patientRef.get();
            displayTreatmentStatus(updatedPatientDoc.data());

            alert(`つけ忘れを記録しました。合計: ${newMissedDays}日`);

        } catch (error) {
            console.error("つけ忘れ日数の更新に失敗しました:", error);
            alert("エラーが発生しました。");
        }
    });
}
// ★★★ ここまで ★★★

// 治療状況を表示する機能 (★★★計算ロジックを変更★★★)
function displayTreatmentStatus(patient) {
  const exchangeInterval = patient.exchangeInterval;
  const missedDays = patient.missedDays || 0; // つけ忘れ日数を取得（なければ0）
  const today = new Date();
  const startDate = new Date(patient.startDate);

  // 治療開始からの経過日数
  const diffTime = today - startDate;
  const totalElapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 有効な治療日数 = 経過日数 - つけ忘れ日数
  const effectiveDays = totalElapsedDays - missedDays;
  
  // 現在のステージを計算 (0日目〜6日目がステージ1の場合)
  const currentStage = Math.floor(effectiveDays / exchangeInterval) + 1;
  
  // 次の交換日を計算
  const daysUntilNext = exchangeInterval - (effectiveDays % exchangeInterval);
  const nextExchangeDate = new Date();
  nextExchangeDate.setDate(today.getDate() + daysUntilNext);

  // 画面に表示
  document.getElementById('current-stage').textContent = currentStage > 0 ? currentStage : 1;
  document.getElementById('total-stages').textContent = patient.totalStages;
  document.getElementById('next-exchange-date').textContent = nextExchangeDate.toLocaleDateString();
  document.getElementById('missed-days').textContent = missedDays;
}


// ==================================================================
// 初期実行処理
// ==================================================================
// ... (この部分は変更なし) ...