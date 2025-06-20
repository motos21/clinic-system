// ==================================================================
// グローバル変数定義
// ==================================================================
let db; 
let currentPatientDocId = null; // ログイン中の患者のFirestoreドキュメントIDを保存

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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  console.log("Firebaseの接続に成功しました！");
} catch (error) {
  console.error("Firebaseの接続に失敗しました:", error);
}

// ==================================================================
// ログインフォームの処理
// ==================================================================
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const clinicIdValue = document.getElementById("clinic-id").value;
    const passwordValue = document.getElementById("password").value;
    const correctId = "test-clinic";
    const correctPassword = "password123";
    if (clinicIdValue === correctId && passwordValue === correctPassword) {
      window.location.href = "patient-list.html";
    } else {
      alert("IDまたはパスワードが間違っています。");
    }
  });
}

// ==================================================================
// 患者登録フォームの処理
// ==================================================================
const addPatientForm = document.getElementById("add-patient-form");
if (addPatientForm) {
  addPatientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newPatient = {
        id: document.getElementById("patient-id").value,
        name: document.getElementById("patient-name").value,
        startDate: document.getElementById("start-date").value,
        totalStages: document.getElementById("total-stages").value,
        exchangeInterval: parseInt(document.getElementById("exchange-interval").value, 10),
        wearTime: parseInt(document.getElementById("wear-time").value, 10),
        createdAt: new Date(),
        missedDays: 0 // ★つけ忘れ日数の初期値を設定
    };
    try {
        await db.collection("patients").add(newPatient);
        await loadAndRenderPatientsForAdmin();
    } catch (error) {
        console.error("Firestoreへの保存に失敗しました: ", error);
        alert("データの登録に失敗しました。");
    }
    addPatientForm.reset();
  });
}

// ==================================================================
// データ処理と画面描画の機能（関数）
// ==================================================================
async function loadAndRenderPatientsForAdmin() {
    const tableBody = document.getElementById("patient-table-body");
    if (!tableBody) { return; }
    try {
        const snapshot = await db.collection("patients").orderBy("createdAt", "desc").get();
        const patientList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        tableBody.innerHTML = "";
        patientList.forEach(patient => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${patient.id}</td><td>${patient.name}</td><td>${patient.startDate}</td><td>${patient.totalStages || ''}</td><td>${patient.exchangeInterval || ''}日</td><td>${patient.wearTime || ''}時間</td>`;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
    }
}

// ==================================================================
// LIFF関連の処理
// ==================================================================
async function initializeLiff() {
  try {
    await liff.init({ liffId: "2007606450-pl2Dn7YW" });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }
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
  } catch (error) {
    console.error("LIFFの処理に失敗しました:", error);
    alert("エラーが発生しました。画面をリロードしてください。");
  }
}

const registrationForm = document.getElementById("registration-form");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const patientIdToLink = document.getElementById("reg-patient-id").value;
    const profile = await liff.getProfile();
    const lineUserId = profile.userId;
    const patientQuery = await db.collection("patients").where("id", "==", patientIdToLink).get();
    if (patientQuery.empty) {
      alert("入力されたカルテ番号が見つかりません。もう一度ご確認ください。");
    } else {
      const patientDoc = patientQuery.docs[0];
      await patientDoc.ref.update({ lineUserId: lineUserId });
      alert("登録が完了しました！");
      window.location.reload();
    }
  });
}

// 「つけ忘れ報告」ボタンの処理 (★★★ここが新しいロジック★★★)
const reportButton = document.getElementById("report-missed-day-button");
if (reportButton) {
    reportButton.addEventListener("click", async () => {
        if (!currentPatientDocId) {
            alert("患者情報が見つかりません。");
            return;
        }

        // 1. ダイアログを表示して、ユーザーに入力を促す
        const daysInput = prompt("何日間つけ忘れましたか？\n数字で入力してください。", "1");

        // 2. 入力内容をチェック
        if (daysInput === null || daysInput.trim() === "") {
            return; // キャンセルされたら何もしない
        }
        const daysToAdd = parseInt(daysInput, 10);
        if (isNaN(daysToAdd) || daysToAdd <= 0) {
            alert("有効な数字を入力してください。");
            return;
        }

        try {
            const patientRef = db.collection("patients").doc(currentPatientDocId);
            
            // 3. 現在の日数を取得し、入力された日数を加算する
            const patientDoc = await patientRef.get();
            const currentMissedDays = patientDoc.data().missedDays || 0;
            const newMissedDays = currentMissedDays + daysToAdd;

            // 4. Firestoreのデータを更新
            await patientRef.update({
                missedDays: newMissedDays
            });
            
            // 5. 画面の表示を更新
            const updatedPatientDoc = await patientRef.get();
            displayTreatmentStatus(updatedPatientDoc.data());

            alert(`${daysToAdd}日間のつけ忘れを記録しました。合計: ${newMissedDays}日`);

        } catch (error) {
            console.error("つけ忘れ日数の更新に失敗しました:", error);
            alert("エラーが発生しました。");
        }
    });
}

// 治療状況を表示する機能
function displayTreatmentStatus(patient) {
  const exchangeInterval = patient.exchangeInterval || 7;
  const missedDays = patient.missedDays || 0;
  const today = new Date();
  const startDate = new Date(patient.startDate);

  // 治療開始からの経過日数
  const diffTime = today - startDate;
  const totalElapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 有効な治療日数 = 経過日数 - つけ忘れ日数
  const effectiveDays = totalElapsedDays - missedDays;
  
  // 現在のステージを計算
  const currentStage = Math.floor(effectiveDays / exchangeInterval) + 1;
  
  // 次の交換まであと何日かを計算
  const daysIntoCurrentStage = effectiveDays % exchangeInterval;
  const daysUntilNext = exchangeInterval - daysIntoCurrentStage;
  
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
const adminTableEl = document.getElementById("patient-table-body");
if (adminTableEl) {
    loadAndRenderPatientsForAdmin();
}
if (typeof liff !== 'undefined') {
    initializeLiff();
}