// ==================================================================
// グローバル変数定義
// ==================================================================
let db; 
let currentPatientDocId = null; 

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
        createdAt: new Date()
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
      currentPatientDocId = patientDoc.id;
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

const reportButton = document.getElementById("report-missed-day-button");
if (reportButton) {
    reportButton.addEventListener("click", async () => {
        if (!currentPatientDocId) {
            alert("患者情報が見つかりません。");
            return;
        }
        if (!confirm("本当に『つけ忘れ』を記録しますか？この操作は取り消せません。")) {
            return;
        }
        try {
            const patientRef = db.collection("patients").doc(currentPatientDocId);
            const patientDoc = await patientRef.get();
            const currentMissedDays = patientDoc.data().missedDays || 0;
            const newMissedDays = currentMissedDays + 1;
            await patientRef.update({ missedDays: newMissedDays });
            const updatedPatientDoc = await patientRef.get();
            displayTreatmentStatus(updatedPatientDoc.data());
            alert(`つけ忘れを記録しました。合計: ${newMissedDays}日`);
        } catch (error) {
            console.error("つけ忘れ日数の更新に失敗しました:", error);
            alert("エラーが発生しました。");
        }
    });
}

function displayTreatmentStatus(patient) {
  const exchangeInterval = patient.exchangeInterval || 7;
  const missedDays = patient.missedDays || 0;
  const today = new Date();
  const startDate = new Date(patient.startDate);
  const diffTime = today - startDate;
  const totalElapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const effectiveDays = totalElapsedDays - missedDays;
  const currentStage = Math.floor(effectiveDays / exchangeInterval) + 1;
  const daysIntoCurrentStage = effectiveDays % exchangeInterval;
  const daysUntilNext = exchangeInterval - daysIntoCurrentStage;
  const nextExchangeDate = new Date();
  nextExchangeDate.setDate(today.getDate() + daysUntilNext);

  document.getElementById('current-stage').textContent = currentStage > 0 ? currentStage : 1;
  document.getElementById('total-stages').textContent = patient.totalStages;
  document.getElementById('next-exchange-date').textContent = nextExchangeDate.toLocaleDateString();
  document.getElementById('missed-days').textContent = missedDays;
}

// ==================================================================
// 初期実行処理 (★★★これが抜け落ちていた最重要部分です★★★)
// ==================================================================

// 管理者画面（patient-list.html）にいるかどうかを、テーブルの存在で判断
const adminTableEl = document.getElementById("patient-table-body");
if (adminTableEl) {
    // 管理者画面にいる場合のみ、患者リストを読み込んで表示
    loadAndRenderPatientsForAdmin();
}

// LIFF環境かどうかを、liffオブジェクトの存在で判断
if (typeof liff !== 'undefined') {
    // LIFF環境の場合のみ、LIFFの初期化を実行
    initializeLiff();
}