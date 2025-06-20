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
  if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
  db = firebase.firestore();
  console.log("Firebaseの接続に成功しました！");
} catch (error) { console.error("Firebaseの接続に失敗しました:", error); }

// ==================================================================
// 管理者画面向けの処理 (ログイン、患者登録、一覧表示など)
// ==================================================================
// ... (この部分は変更がないので、お手元のコードのままでOKです) ...
const loginForm = document.getElementById("login-form");
if (loginForm) { /* ... */ }
const addPatientForm = document.getElementById("add-patient-form");
if (addPatientForm) { /* ... */ }
function renderPatientList() { /* ... */ }
async function loadAndRenderPatientsForAdmin() { /* ... */ } // 名前を少し変更


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

    // ★★★ ここからが新しいロジック ★★★
    // 1. LocalStorageに「登録済み」の印があるかチェック
    const isRegistered = localStorage.getItem('isRegistered-' + profile.userId);

    if (isRegistered) {
      // 登録済みの場合
      console.log("登録済みのユーザーです。");
      document.getElementById('treatment-status').style.display = 'block'; // 治療状況を表示
      document.getElementById('initial-registration').style.display = 'none'; // 登録フォームは隠す
      // 登録済みの患者データを表示する (テストのため、今回も一番最初の患者データを表示)
      const allPatients = await loadAllPatientsFromFirestore();
      if (allPatients.length > 0) {
        displayTreatmentStatus(allPatients[0]);
      }
    } else {
      // 未登録の場合
      console.log("未登録のユーザーです。");
      document.getElementById('initial-registration').style.display = 'block'; // 登録フォームを表示
      document.getElementById('treatment-status').style.display = 'none'; // 治療状況は隠す
    }

  } catch (error) {
    console.error("LIFF initialization failed", error);
  }
}

// 初回登録フォームの処理
const registrationForm = document.getElementById("registration-form");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const patientId = document.getElementById("reg-patient-id").value;
    const profile = await liff.getProfile();
    const lineUserId = profile.userId;

    console.log(`カルテ番号: ${patientId} と LINEユーザーID: ${lineUserId} の紐付け処理を開始します。`);

    // TODO: ここで、Firestore上の患者データに、このlineUserIdを保存する処理を後で追加する

    // 登録済みの印をLocalStorageに保存
    localStorage.setItem('isRegistered-' + lineUserId, 'true');
    alert("登録が完了しました！");
    
    // 画面をリロードして、表示を切り替える
    window.location.reload();
  });
}

// Firestoreから全患者データを読み込む機能
async function loadAllPatientsFromFirestore() {
    try {
        const snapshot = await db.collection("patients").get();
        return snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
        return [];
    }
}

// 受け取った患者データで治療状況を表示する機能
function displayTreatmentStatus(patient) {
  const exchangeInterval = 7;
  const today = new Date();
  const startDate = new Date(patient.startDate);
  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentStage = Math.ceil(diffDays / exchangeInterval);
  const nextExchangeDays = currentStage * exchangeInterval;
  const nextExchangeDate = new Date(startDate);
  nextExchangeDate.setDate(startDate.getDate() + nextExchangeDays);

  document.getElementById('current-stage').textContent = currentStage;
  document.getElementById('total-stages').textContent = patient.totalStages;
  document.getElementById('next-exchange-date').textContent = nextExchangeDate.toLocaleDateString();
}

// ==================================================================
// 初期実行処理
// ==================================================================

//【注意】管理者画面とLIFF画面で処理を分けるため、以下のコードも全差し替え
// 管理者画面（患者一覧テーブルがあるページ）の場合のみ、管理者用のデータ読み込みを実行
const adminTable = document.getElementById("patient-table-body");
if (adminTable) {
    // 非同期処理を正しく呼び出すために、少し修正
    (async () => {
        const allPatients = await loadAllPatientsFromFirestore();
        patientList = allPatients;
        renderPatientList();
    })();
}

// 'liff' というものが存在する場合（つまりLIFFページの場合）のみ、LIFFの初期化を実行する
if (typeof liff !== 'undefined') {
  initializeLiff();
}