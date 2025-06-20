// ==================================================================
// グローバル変数定義
// ==================================================================
let patientList = []; 
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

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  console.log("Firebaseの接続に成功しました！");
} catch (error) {
  console.error("Firebaseの接続に失敗しました:", error);
  alert("システムの初期化に失敗しました。");
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
      console.log("ログイン成功！患者一覧画面に移動します。");
      window.location.href = "patient-list.html";
    } else {
      console.log("ログイン失敗：IDまたはパスワードが間違っています。");
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
    const patientId = document.getElementById("patient-id").value;
    const patientName = document.getElementById("patient-name").value;
    const totalStages = document.getElementById("total-stages").value;
    const startDate = document.getElementById("start-date").value;
    const newPatient = {
        id: patientId,
        name: patientName,
        startDate: startDate,
        totalStages: totalStages,
        createdAt: new Date()
    };
    try {
        await db.collection("patients").add(newPatient);
        console.log("患者データをFirestoreに保存しました。");
        await loadAndRenderPatients();
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
async function loadAndRenderPatients() {
    if (!document.getElementById("patient-table-body")) {
        return;
    }
    console.log("Firestoreからデータを読み込んでいます...");
    try {
        // ★★★ ここを修正 ★★★
        // .orderBy("createdAt", "desc") の部分を一旦削除します
        const snapshot = await db.collection("patients").get();
        
        patientList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        renderPatientList();
        console.log("データの読み込みと画面表示が完了しました。");
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
    }
}
function renderPatientList() {
  const tableBody = document.getElementById("patient-table-body");
  if (!tableBody) { return; }
  tableBody.innerHTML = "";
  patientList.forEach(patient => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${patient.id}</td>
        <td>${patient.name}</td>
        <td>${patient.startDate}</td>
        <td>${patient.totalStages || ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ==================================================================
// LIFF関連の処理 (中身は省略)
// ==================================================================
async function initializeLiff() { /* ... */ }

// ==================================================================
// 初期実行処理
// ==================================================================
loadAndRenderPatients();
if (typeof liff !== 'undefined') {
  initializeLiff();
}