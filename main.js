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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  console.log("Firebaseの接続に成功しました！");
} catch (error) {
  console.error("Firebaseの接続に失敗しました:", error);
}

// ==================================================================
// 管理者画面向けの処理
// ==================================================================
const loginForm = document.getElementById("login-form");
if (loginForm) { /* ... ログイン処理 ... */ }

const addPatientForm = document.getElementById("add-patient-form");
if (addPatientForm) {
  addPatientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const patientId = document.getElementById("patient-id").value;
    const patientName = document.getElementById("patient-name").value;
    const totalStages = document.getElementById("total-stages").value;
    const startDate = document.getElementById("start-date").value;
    const newPatient = { id: patientId, name: patientName, startDate: startDate, totalStages: totalStages, createdAt: new Date() };
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

async function loadAndRenderPatientsForAdmin() {
    const tableBody = document.getElementById("patient-table-body");
    if (!tableBody) { return; }
    try {
        const snapshot = await db.collection("patients").get();
        const patientList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        tableBody.innerHTML = "";
        patientList.forEach(patient => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${patient.id}</td><td>${patient.name}</td><td>${patient.startDate}</td><td>${patient.totalStages || ''}</td>`;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
    }
}

// ==================================================================
// LIFF関連の処理 (★★★ここからが今回のメインの変更箇所★★★)
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

    // 1. 自分のLINE IDに紐づく患者データが、Firestoreにあるか検索
    const patientQuery = await db.collection("patients").where("lineUserId", "==", profile.userId).get();

    if (patientQuery.empty) {
      // 2. データがなければ、未登録ユーザー。初回登録フォームを表示
      console.log("未登録のユーザーです。");
      document.getElementById('initial-registration').style.display = 'block';
      document.getElementById('treatment-status').style.display = 'none';
    } else {
      // 3. データがあれば、登録済みユーザー。治療状況を表示
      console.log("登録済みのユーザーです。");
      document.getElementById('treatment-status').style.display = 'block';
      document.getElementById('initial-registration').style.display = 'none';
      const patientData = patientQuery.docs[0].data();
      displayTreatmentStatus(patientData);
    }

  } catch (error) {
    console.error("LIFFの処理に失敗しました:", error);
    alert("エラーが発生しました。画面をリロードしてください。");
  }
}

// 初回登録フォームの処理
const registrationForm = document.getElementById("registration-form");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const patientIdToLink = document.getElementById("reg-patient-id").value;
    const profile = await liff.getProfile();
    const lineUserId = profile.userId;

    // 1. 入力されたカルテ番号を持つ患者データを探す
    const patientQuery = await db.collection("patients").where("id", "==", patientIdToLink).get();

    if (patientQuery.empty) {
      // 2.該当する患者が見つからなければエラー
      alert("入力されたカルテ番号が見つかりません。もう一度ご確認ください。");
    } else {
      // 3. 患者が見つかったら、そのデータにLINEユーザーIDを書き込む（紐付け！）
      const patientDoc = patientQuery.docs[0];
      await patientDoc.ref.update({
        lineUserId: lineUserId
      });

      alert("登録が完了しました！");
      window.location.reload(); // 画面をリロードして、表示を切り替える
    }
  });
}

// 受け取った患者データで治療状況を表示する機能
function displayTreatmentStatus(patient) {
    // ... (この関数の中身は変更なし) ...
}

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