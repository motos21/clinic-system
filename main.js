// ==================================================================
// Firebaseの初期化処理
// ==================================================================

// この変数は、後でデータベースから読み込んだデータで上書きされます
let patientList = []; 
// Firestoreデータベースのインスタンスを保持する変数
let db; 

try {
  // ▼▼▼ あなたのFirebase設定情報をここに貼り付けてください ▼▼▼
  const firebaseConfig = {
    apiKey: "AIzaSyCAPRwg5mGMh8LRqCbRmoYwzqK-Msevv1g",
  authDomain: "clinic-system-7a716.firebaseapp.com",
  projectId: "clinic-system-7a716",
  storageBucket: "clinic-system-7a716.firebasestorage.app",
  messagingSenderId: "15021094859",
  appId: "1:15021094859:web:e33fd4e47813499051284e"
  };
  // ▲▲▲ ここまで ▲▲▲

  // Firebaseを初期化
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  // Firestoreのインスタンスを取得
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
    // ... (ログイン処理の中身は変更なし) ...
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
  // ★ `async` を追加
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
        createdAt: new Date() // ★ 登録日時も記録
    };

    // ★ Firestoreにデータを保存する処理に書き換え
    try {
        await db.collection("patients").add(newPatient);
        console.log("患者データをFirestoreに保存しました。");
        // データを再読み込みして画面を更新
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

// --- Firestoreから患者データを読み込んで、画面に表示する機能 ---
// ★ `async` を追加
async function loadAndRenderPatients() {
    // もし管理者画面でなければ、何もしない
    if (!document.getElementById("patient-table-body")) {
        return;
    }
    
    console.log("Firestoreからデータを読み込んでいます...");
    try {
        const snapshot = await db.collection("patients").orderBy("createdAt", "desc").get();
        // 取得したデータを、グローバル変数のpatientListに格納する
        patientList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        
        // 画面を再描画する
        renderPatientList();
        console.log("データの読み込みと画面表示が完了しました。");
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
    }
}

// --- 患者リストを画面のテーブルに表示する機能（中身はほぼ変更なし） ---
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
// LIFF関連の処理
// ==================================================================
// ★ `async` を追加
async function initializeLiff() {
  try {
    // ... (LIFFの初期化処理の中身は変更なし) ...
  } catch (error) {
    console.error("LIFF initialization failed", error);
  }
}

// ==================================================================
// 初期実行処理
// ==================================================================

// ★★★ ここを修正 ★★★
// ページが読み込まれたら、まずFirestoreからデータを読み込んで表示する
loadAndRenderPatients();

// もし 'liff' が存在する場合のみ、LIFFの初期化を実行する
if (typeof liff !== 'undefined') {
  initializeLiff();
}