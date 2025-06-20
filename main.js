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
      const patientData = patientQuery.docs[0].data();
      displayTreatmentStatus(patientData);
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

function displayTreatmentStatus(patient) {
  const exchangeInterval = patient.exchangeInterval;
  const today = new Date();
  const startDate = new Date(patient.startDate);
  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentStage = Math.ceil(diffDays / exchangeInterval);
  const nextExchangeDays = (currentStage * exchangeInterval) - diffDays;
  const nextExchangeDate = new Date();
  nextExchangeDate.setDate(today.getDate() + nextExchangeDays);

  document.getElementById('current-stage').textContent = currentStage;
  document.getElementById('total-stages').textContent = patient.totalStages;
  document.getElementById('next-exchange-date').textContent = nextExchangeDate.toLocaleDateString();
}

// ==================================================================
// 初期実行処理
// ==================================================================
const adminTable = document.getElementById("patient-table-body");
if (adminTable) {
    (async () => {
        await loadAndRenderPatientsForAdmin();
    })();
}

if (typeof liff !== 'undefined') {
  initializeLiff();
}