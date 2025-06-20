// ==================================================================
// グローバル変数定義
// ==================================================================

// アプリケーション起動時に、LocalStorageから保存されたデータを読み込む
let patientList = loadPatientList();


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
  addPatientForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const patientId = document.getElementById("patient-id").value;
    const patientName = document.getElementById("patient-name").value;
    const startDate = document.getElementById("start-date").value;
    const newPatient = { id: patientId, name: patientName, startDate: startDate };
    patientList.push(newPatient);
    savePatientList();
    console.log("データが追加されました。現在の患者リスト:", patientList);
    renderPatientList();
    addPatientForm.reset();
  });
}

// ==================================================================
// 画面描画関連の機能（関数）
// ==================================================================
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
    `;
    tableBody.appendChild(row);
  });
}

// ==================================================================
// LocalStorage関連の機能（関数）
// ==================================================================
function savePatientList() {
    localStorage.setItem('clinicPatientList', JSON.stringify(patientList));
}
function loadPatientList() {
    const savedList = localStorage.getItem('clinicPatientList');
    if (savedList) {
        return JSON.parse(savedList);
    } else {
        return [];
    }
}


// ==================================================================
// LIFF関連の処理
// ==================================================================
async function initializeLiff() {
  try {
    // ★★★ ここに取得したLIFF IDを設定 ★★★
    await liff.init({ liffId: "2007606450-pl2Dn7YW" });

    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      const profile = await liff.getProfile();
      const userIdElement = document.getElementById("user-id");
      if (userIdElement) {
        userIdElement.textContent = profile.userId;
      }
      const lineVersionElement = document.getElementById("line-version");
      if (lineVersionElement) {
        lineVersionElement.textContent = liff.getLineVersion() || "N/A";
      }
    }
  } catch (error) {
    console.error("LIFF initialization failed", error);
    alert("LIFFの初期化に失敗しました。");
  }
}

// ==================================================================
// 初期実行処理
// ==================================================================

// ページ読み込み時に、保存されているデータを一覧に初回描画する
renderPatientList();

// LIFFの初期化を実行する
initializeLiff();