// ==================================================================
// グローバル変数定義
// ==================================================================
let db; 
let fullPatientList = [];
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
    const exchangeInterval = parseInt(document.getElementById("exchange-interval").value, 10);
    const currentStage = parseInt(document.getElementById("current-stage-input").value, 10);
    const currentStageStartDate = new Date(document.getElementById("current-stage-start-date").value);
    const daysToSubtract = (currentStage - 1) * exchangeInterval;
    const virtualStartDate = new Date(currentStageStartDate);
    virtualStartDate.setDate(currentStageStartDate.getDate() - daysToSubtract);
    const newPatient = {
        id: document.getElementById("patient-id").value,
        name: document.getElementById("patient-name").value,
        startDate: virtualStartDate.toISOString().split('T')[0],
        totalStages: document.getElementById("total-stages").value,
        exchangeInterval: exchangeInterval,
        wearTime: parseInt(document.getElementById("wear-time").value, 10),
        createdAt: new Date(),
        missedDays: 0,
        stageOverrides: {}
    };
    try {
        await db.collection("patients").add(newPatient);
        await loadAndRenderPatientsForAdmin();
        alert("患者情報が正常に登録されました。");
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
    } catch (error) { console.error("データの読み込みに失敗しました: ", error); }
}

function renderPatientList(patientsToDisplay) {
  const tableBody = document.getElementById("patient-table-body");
  if (!tableBody) { return; }
  tableBody.innerHTML = "";
  patientsToDisplay.forEach(patient => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${patient.id}</td><td><a href="patient-detail.html?docId=${patient.docId}">${patient.name}</a></td><td>${patient.startDate}</td><td>${patient.totalStages || ''}</td><td>${patient.exchangeInterval || ''}日</td><td>${patient.wearTime || ''}時間</td>`;
      tableBody.appendChild(row);
  });
}

async function loadPatientDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('docId');
    const patientInfoDiv = document.getElementById("patient-info");
    if (!docId) { patientInfoDiv.innerHTML = "<p>患者IDが指定されていません。</p>"; return; }
    try {
        const patientRef = db.collection("patients").doc(docId);
        const doc = await patientRef.get();
        if (!doc.exists) { patientInfoDiv.innerHTML = "<p>該当する患者データが見つかりません。</p>"; return; }
        const patient = doc.data();
        currentPatientDocId = docId;
        document.getElementById("detail-id").textContent = patient.id;
        document.getElementById("detail-name").textContent = patient.name;
        document.getElementById("detail-start-date").textContent = patient.startDate;
        document.getElementById("detail-total-stages").textContent = patient.totalStages;
        document.getElementById("detail-exchange-interval").textContent = patient.exchangeInterval;
        document.getElementById("detail-missed-days").textContent = patient.missedDays || 0;
        renderScheduleTable(patient, "schedule-table-body");
    } catch (error) { console.error("患者詳細の読み込みに失敗しました:", error); }
}

const scheduleTable = document.getElementById("schedule-table-body");
if (scheduleTable) {
    scheduleTable.addEventListener('click', async (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.dataset.stage) {
            const stage = event.target.dataset.stage;
            const patientRef = db.collection("patients").doc(currentPatientDocId);
            const doc = await patientRef.get();
            const patient = doc.data();
            const overrides = patient.stageOverrides || {};
            const currentInterval = (overrides && overrides[stage]) ? overrides[stage] : patient.exchangeInterval;
            const newIntervalInput = prompt(`ステージ ${stage} の新しい交換日数（日）を入力してください。\n現在の設定: ${currentInterval}日\n(空欄でデフォルトに戻します)`, currentInterval);
            if (newIntervalInput !== null) {
                if (newIntervalInput.trim() === "" || parseInt(newIntervalInput) === patient.exchangeInterval) {
                    delete overrides[stage];
                } else {
                    const newInterval = parseInt(newIntervalInput, 10);
                    if (!isNaN(newInterval) && newInterval > 0) {
                        overrides[stage] = newInterval;
                    } else {
                        alert("有効な数字を入力してください。");
                        return;
                    }
                }
                try {
                    await patientRef.update({ stageOverrides: overrides });
                    alert(`ステージ ${stage} の設定を更新しました。`);
                    loadPatientDetail();
                } catch (error) { console.error("交換日数の更新に失敗しました:", error); }
            }
        }
    });
}

// ==================================================================
// LIFF関連の処理
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
      currentPatientDocId = patientDoc.id;
      const patientData = patientDoc.data();
      displayTreatmentStatus(patientData);
      renderScheduleTable(patientData, "liff-schedule-table-body");
    }
  } catch (error) { console.error("LIFFの処理に失敗しました:", error); }
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
      alert("入力されたカルテ番号が見つかりません。");
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
        if (!currentPatientDocId) { alert("患者情報が見つかりません。"); return; }
        const daysInput = prompt("何日間つけ忘れましたか？\n数字で入力してください。", "1");
        if (daysInput === null || daysInput.trim() === "") { return; }
        const daysToAdd = parseInt(daysInput, 10);
        if (isNaN(daysToAdd) || daysToAdd <= 0) { alert("有効な数字を入力してください。"); return; }
        try {
            const patientRef = db.collection("patients").doc(currentPatientDocId);
            const patientDoc = await patientRef.get();
            const currentMissedDays = patientDoc.data().missedDays || 0;
            const newMissedDays = currentMissedDays + daysToAdd;
            await patientRef.update({ missedDays: newMissedDays });
            const updatedPatientDoc = await patientRef.get();
            const updatedPatientData = updatedPatientDoc.data();
            displayTreatmentStatus(updatedPatientData);
            renderScheduleTable(updatedPatientData, "liff-schedule-table-body");
            alert(`${daysToAdd}日間のつけ忘れを記録しました。合計: ${newMissedDays}日`);
        } catch (error) { console.error("つけ忘れ日数の更新に失敗しました:", error); }
    });
}

function displayTreatmentStatus(patient) {
  const schedule = calculateSchedule(patient);
  const today = new Date();
  today.setHours(0,0,0,0);
  let currentStageItem = schedule.find(item => today < item.exchangeDate);
  let currentStage = currentStageItem ? currentStageItem.stage : parseInt(patient.totalStages, 10);
  let nextExchangeDate = currentStageItem ? currentStageItem.exchangeDate : schedule[schedule.length-1].exchangeDate;
  document.getElementById('current-stage').textContent = currentStage;
  document.getElementById('total-stages').textContent = patient.totalStages;
  document.getElementById('next-exchange-date').textContent = nextExchangeDate.toLocaleDateString();
  document.getElementById('missed-days').textContent = patient.missedDays || 0;
}

function calculateSchedule(patient) {
    const schedule = [];
    const totalStages = parseInt(patient.totalStages, 10);
    const startDate = new Date(patient.startDate);
    const defaultInterval = patient.exchangeInterval || 7;
    const missedDays = patient.missedDays || 0;
    const overrides = patient.stageOverrides || {};
    let cumulativeDays = 0;
    for (let i = 1; i <= totalStages; i++) {
        const interval = overrides[String(i)] ? parseInt(overrides[String(i)], 10) : defaultInterval;
        cumulativeDays += interval;
        const exchangeDate = new Date(startDate);
        exchangeDate.setDate(startDate.getDate() + cumulativeDays + missedDays);
        schedule.push({ stage: i, exchangeDate: exchangeDate, interval: interval });
    }
    return schedule;
}

function renderScheduleTable(patient, tableBodyId) {
    const scheduleTableBody = document.getElementById(tableBodyId);
    if (!scheduleTableBody) return;
    const schedule = calculateSchedule(patient);
    scheduleTableBody.innerHTML = "";
    schedule.forEach(item => {
        const row = document.createElement("tr");
        let editButtonHtml = '';
        if (tableBodyId === 'schedule-table-body') {
            editButtonHtml = `<td><button class="outline edit-btn" data-stage="${item.stage}">編集</button></td>`;
        }
        row.innerHTML = `<td>ステージ ${item.stage}</td><td>${item.exchangeDate.toLocaleDateString()}</td><td>${item.interval} 日</td>${editButtonHtml}`;
        scheduleTableBody.appendChild(row);
    });
}

// ==================================================================
// 初期実行処理
// ==================================================================
const adminListPage = document.getElementById("patient-table-body");
const adminDetailPage = document.getElementById("patient-info");
if (adminListPage && !adminDetailPage) {
    loadAndRenderPatientsForAdmin();
} else if (adminDetailPage) {
    loadPatientDetail();
} else if (typeof liff !== 'undefined') {
    initializeLiff();
}