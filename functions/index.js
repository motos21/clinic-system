// 最新版（v2）の書き方で、HTTP関数とロガーをインポートします
const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");

/**
 * "helloWorld" という名前の、シンプルなHTTP関数。
 * この関数は、デプロイ後に作られる専用のURLにアクセスすると実行されます。
 */
exports.helloWorld = onRequest({ region: "asia-northeast1" }, (request, response) => {
  // ログにメッセージを記録し、
  logger.info("Hello worldログ！", {structuredData: true});
  // 画面に「Hello from Firebase!」という文字を返す
  response.send("Hello from Firebase!");
});