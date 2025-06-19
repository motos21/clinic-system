// IDを使ってHTMLのフォーム要素を取得する
const loginForm = document.getElementById("login-form");

// フォームが「送信（submit）」された時のイベントを設定する
loginForm.addEventListener("submit", (event) => {
    // フォームが元々持っているページ移動機能を一旦停止する
    event.preventDefault(); 

    // --- ここからがログイン処理のロジック ---
    // 1. 入力された値を取得する
    const clinicIdValue = document.getElementById("clinic-id").value;
    const passwordValue = document.getElementById("password").value;

    // 2. 正解のIDとパスワードを、プログラムの中に仮で設定する
    const correctId = "test-clinic";
    const correctPassword = "password123";

    // 3. 入力された値と正解を比較し、動きを変える（条件分岐）
    if (clinicIdValue === correctId && passwordValue === correctPassword) {
        // もし両方とも正しかったら、この中の処理を実行
        console.log("ログイン成功！患者一覧画面に移動します。");
        // ページを移動させる命令
        window.location.href = "patient-list.html";
    } else {
        // もし間違っていたら、この中の処理を実行
        console.log("ログイン失敗：IDまたはパスワードが間違っています。");
        // ユーザーに直接エラーを知らせるポップアップ
        alert("IDまたはパスワードが間違っています。");
    }
    // --- ここまでがログイン処理のロジック ---
});