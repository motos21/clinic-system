// ==================================================================
// グローバル変数定義
// ==================================================================
let db; 
let fullPatientList = []; // 管理者画面の全患者リストを保存するための変数
let currentPatientDocId = null; // LIFF画面で使う、ログイン中患者のドキュメントID

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
        missedDays: 0
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
// 患者検索フォームの処理
// ==================================================================
const searchForm = document.getElementById("search-form");
if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const searchText = document.getElementById("search-id").value;
        if (!searchText) {
            renderPatientList(fullPatientList);
            return;
        }
        const filteredPatients = fullPatientList.filter(patient => patient.id.includes(searchText));
        renderPatientList(filteredPatients);
    });
}

const clearSearchButton = document.getElementById("clear-search-button");
if (clearSearchButton) {
    clearSearchButton.addEventListener("click", () => {
        document.getElementById("search-id").value = "";
        renderPatientList(fullPatientList);
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
        fullPatientList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        renderPatientList(fullPatientList);
    } catch (error) {
        console.error("データの読み込みに失敗しました: ", error);
    }
}

function renderPatientList(patientsToDisplay) {
  const tableBody = document.getElementById("patient-table-body");
  if (!tableBody) { return; }
  tableBody.innerHTML = "";
  patientsToDisplay.forEach(patient => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${patient.id}</td>
          <td><a href="patient-detail.html?docId=${patient.docId}">${patient.name}</a></td>
          <td>${patient.startDate}</td>
          <td>${patient.totalStages || ''}</td>
          <td>${patient.exchangeInterval || ''}日</td>
          <td>${patient.wearTime || ''}時間</td>
      `;
      tableBody.appendChild(row);
  });
}

// ★★★ ここからが新しい機能 ★★★
async function loadPatientDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('docId');
    const patientInfoDiv = document.getElementById("patient-info");

    if (!docId) {
        patientInfoDiv.innerHTML = "<p>患者IDが指定されていません。</p>";
        return;
    }

    try {
        const patientRef = db.collection("patients").doc(docId);
        const doc = await patientRef.get();

        if (!doc.exists) {
            patientInfoDiv.innerHTML = "<p>該当する患者データが見つかりません。</p>";
            return;
        }

        const patient = doc.data();
        document.getElementById("detail-id").textContent = patient.id;
        document.getElementById("detail-name").textContent = patient.name;
        document.getElementById("detail-start-date").textContent = patient.startDate;
        document.getElementById("detail-total-stages").textContent = patient.totalStages;
        document.getElementById("detail-exchange-interval").textContent = patient.exchangeInterval;
        document.getElementById("detail-missed-days").textContent = patient.missedDays || 0;

        const scheduleTableBody = document.getElementById("schedule-table-body");
        scheduleTableBody.innerHTML = "";
        const totalStages = parseInt(patient.totalStages, 10);
        const startDate = new Date(patient.startDate);
        const exchangeInterval = patient.exchangeInterval || 7;

        for (let i = 1; i <= totalStages; i++) {
            const row = document.createElement("tr");
            const exchangeDate = new Date(startDate);
            exchangeDate.setDate(startDate.getDate() + (i * exchangeInterval));
            row.innerHTML = `<td>ステージ ${i}</td><td>${exchangeDate.toLocaleDateString()}</td>`;
            scheduleTableBody.appendChild(row);
        }
    } catch (error) {
        console.error("患者詳細の読み込みに失敗しました:", error);
        patientInfoDiv.innerHTML = "<p>データの読み込み中にエラーが発生しました。</p>";
    }
}
// ★★★ ここまで ★★★

// ==================================================================
// LIFF関連の処理
// ==================================================================
async function initializeLiff() { /* ... */ }
const registrationForm = document.getElementById("registration-form");
if (registrationForm) { /* ... */ }
const reportButton = document.getElementById("report-missed-day-button");
if (reportButton) { /* ... */ }
function displayTreatmentStatus(patient) { /* ... */ }


// ==================================================================
// 初期実行処理
// ==================================================================
const adminListPage = document.getElementById("patient-table-body");
const adminDetailPage = document.getElementById("patient-info");

if (adminListPage) {
    loadAndRenderPatientsForAdmin();
} else if (adminDetailPage) {
    loadPatientDetail();
} else if (typeof liff !== 'undefined') {
    initializeLiff();
}