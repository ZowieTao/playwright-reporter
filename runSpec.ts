const { execSync } = require("child_process");
const cron = require("node-cron");

// 定义要运行的 spec.ts 文件的路径
const specFilePath = "./twitter-tests/twitter-selector.spec.ts";

cron.schedule("0 * * * *", () => {
  console.log("start test: ", Date.now());
  try {
    execSync(`npx playwright test ${specFilePath}`);
  } catch (error) {
    console.error("schedule error:", error);
  }
});
