// ==================================================================
// グローバル変数定義
// ==================================================================
let db; 

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
      console.log("ログイン成功！患者一覧画面に移動します。");
      window.location.href = "patient-list.html";
    } else {
      console.log("ログイン失敗：IDまたはパスワードが間違っています。");
      alert("IDまたはパスワードが間違っています。");
    }
  });
}

// ==================================================================
// 患者登録フォームの処理 (★★★ここが変更点★★★)
// ==================================================================
const addPatientForm = document.getElementById("add-patient-form");
if (addPatientForm) {
  addPatientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const patientId = document.getElementById("patient-id").value;
    const patientName = document.getElementById("patient-name").value;
    const totalStages = document.getElementById("total-stages").value;
    const startDate = document.getElementById("start-date").value;
    // 新しい項目の値を取得
    const exchangeInterval = document.getElementById("exchange-interval").value;
    const wearTime = document.getElementById("wear-time").value;
    
    const newPatient = {
        id: patientId,
        name: patientName,
        startDate: startDate,
        totalStages: totalStages,
        exchangeInterval: parseInt(exchangeInterval, 10), // 文字列を数値に変換
        wearTime: parseInt(wearTime, 10),                 // 文字列を数値に変換
        createdAt: new Date()
    };
    try {
        await db.collection("patients").add(newPatient);
        console.log("患者データをFirestoreに保存しました。");
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
        const snapshot = await db.collection("patients").get();
        const patientList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        tableBody.innerHTML = "";
        patientList.forEach(patient => {
            const row = document.createElement("tr");
            // ★★★テーブルに表示する内容も変更★★★
            row.innerHTML = `
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.startDate}</td>
                <td>${patient.totalStages || ''}</td>
                <td>${patient.exchangeInterval || ''}日</td>
                <td>${patient.wearTime || ''}時間</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
    }
}
// (LIFF関連の関数は、今回は変更ありません)
async function initializeLiff() { /* ... */ }
function displayTreatmentStatus(patient) { /* ... */ }

// ==================================================================
// 初期実行処理
// ==================================================================
const adminTable = document.getElementById("patient-table-body");
if (adminTable) {
    loadAndRenderPatientsForAdmin();
}
if (typeof liff !== 'undefined') {
  initializeLiff();
}