import { test, expect, Page, BrowserContext } from "@playwright/test";

const selector = {
  lastUpdateTime: "1695106363005",
  e2eID: "data-testid",
  tabBar: {
    home: 'a[data-testid="AppTabBar_Home_Link"]',
    explore: 'a[data-testid="AppTabBar_Explore_Link"]',
  },
  actions: {
    bookmark: {
      firstArticle:
        'article[data-testid="tweet"][tabindex="-1"][role="article"]',
      bookmarkButton: 'div[data-testid$="ookmark"]',
    },
    follow: {
      profile:
        'div[aria-label="Home timeline"][tabindex="0"]:not([data-testid="sidebarColumn"])',
      followButton: 'div[role="button"][aria-label^="Follow"]',
    },
    getAccountStatistic: {
      userName: 'div[data-testid="UserName"]',
    },
    getHotTweet: {
      exploreButton: 'a[data-testid="AppTabBar_Explore_Link"]',
      searchInput: 'input[data-testid="SearchBox_Search_Input"]',
      emptyResult: 'div[data-testid="emptyState"]',
      searchForm: 'form[role="search"]',
      cellInnerDiv: 'div[data-testid="cellInnerDiv"]',
      tweetArticle: 'article[data-testid="tweet"]',
    },
    like: {
      firstArticle:
        'article[data-testid="tweet"][tabindex="-1"][role="article"]',
      likeButton: 'div[data-testid$="like"]',
    },
    reply: {
      editable: 'div[contenteditable="true"]',
      tweetButtonInline: 'div[data-testid="tweetButtonInline"]',
    },
    retweet: {
      firstArticle:
        'article[data-testid="tweet"][tabindex="-1"][role="article"]',
      retweetMenuButton: 'div[data-testid$="retweet"]',
      retweetConfirmButton: '#react-root div[data-testid="retweetConfirm"]',
    },
    sendTweet: {
      home: 'a[data-testid="AppTabBar_Home_Link"]',
      toolBar: 'div[data-testid="toolBar"]',
      tweetButtonInline: 'div[data-testid="tweetButtonInline"]',
    },
  },
};

let isTestFailed = false;

let sharedContext: BrowserContext;

test.beforeAll(async ({ browser }) => {
  try {
    sharedContext = await browser.newContext({
      storageState: "state.local.json",
    });
  } catch (error) {
    sharedContext = await browser.newContext();
  }
});

test.afterAll(async () => {
  await sharedContext.close();
});

test.describe("Twitter test", () => {
  //login getAccountStatistic sendTweet getHotTweet bookmark follow like reply retweet

  test("should allow me to login and get my nickname@handle", async ({}, testInfo) => {
    // Fill in the login form
    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/i/flow/login");

    const cookie = (await sharedContext.cookies("https://twitter.com/")).filter(
      (val) => {
        return val.name === "auth_token";
      }
    );

    if (cookie.length > 0) {
      await newPage.goto("https://twitter.com/home");
    } else {
      await newPage.fill(
        'input[autocomplete="username"]',
        process.env.TWITTER_TEST_ACCOUNT as string
      );

      await newPage.keyboard.press("Tab");
      await newPage.keyboard.press("Enter");

      // Fill in the login form
      await newPage.fill(
        'input[autocomplete="current-password"]',
        process.env.TWITTER_TEST_PASSWORD as string
      );
      await newPage.keyboard.press("Tab");
      await newPage.keyboard.press("Tab");
      await newPage.keyboard.press("Tab");
      await newPage.keyboard.press("Enter");
    }
    await newPage.waitForTimeout(1000); // 等待1秒钟

    const btnText = await newPage.textContent(
      'div[data-testid="SideNav_AccountSwitcher_Button"]'
    );

    // Assert that the login was successful
    try {
      // expect(btnText).toContain("process.env.TWITTER_TEST_ACCOUNT" as string);
      expect(btnText).toContain(process.env.TWITTER_TEST_ACCOUNT as string);
      await newPage.close();
    } catch (error) {
      reportErrorMessage(testInfo.title);

      isTestFailed = true;
    }

    sharedContext.storageState({ path: "state.local.json" });
  });

  test("show router to profile and get user info", async ({}, testInfo) => {
    isTestFailed && test.skip();

    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/home");

    newPage.click('a[data-testid="AppTabBar_Profile_Link"]');

    const loggedInUserInfo = await newPage.textContent(
      'div[data-testid="UserName"]'
    );
    try {
      expect(loggedInUserInfo).toContain(
        process.env.TWITTER_TEST_ACCOUNT as string
      );
      await newPage.close(); // 关闭页面
    } catch (error) {
      reportErrorMessage(testInfo.title);
      isTestFailed = true;
    }
  });

  test("send a tweet for test", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/");

    await newPage.click('a[data-testid="AppTabBar_Home_Link"]');

    await newPage.click('div[data-testid="tweetTextarea_0"]');

    let inputContent = generateGreeting();

    for (const char of inputContent) {
      await newPage.waitForTimeout(200);
      await newPage.keyboard.press(char);
    }

    await newPage.click('div[data-testid="tweetButtonInline"]');

    await newPage.waitForTimeout(3000);

    const cellContent =
      (await newPage.textContent('div[data-testid="cellInnerDiv"]')) ?? "";

    if (
      cellContent
        .replace(/[\s\uFEFF\xA0]+/g, "")
        .includes(inputContent.replace(/[\s\uFEFF\xA0]+/g, ""))
    ) {
      await newPage.close(); // 关闭页面
      test.skip();
    } else {
      const assertiveContent =
        (await newPage.textContent(
          'div[aria-live="assertive"][role="status"]'
        )) ?? "";

      if (assertiveContent.includes("You already said that")) {
        await newPage.close();
        test.skip();
      } else {
        reportErrorMessage(testInfo.title);
        isTestFailed = true;
      }
    }
  });

  test("get some hot twitter info", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const newPage = await sharedContext.newPage();
    const {
      actions: { getHotTweet: getHotSelector },
    } = selector;

    await newPage.goto("https://twitter.com/home");

    await newPage.click(getHotSelector.exploreButton);

    await newPage.click(getHotSelector.searchInput);

    await newPage.fill(getHotSelector.searchInput, "AI");

    await newPage.keyboard.press("Enter");

    await newPage.waitForTimeout(3000);

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`,
      {
        position: {
          x: 10,
          y: 10,
        },
      }
    );

    await newPage.waitForURL(/^https:\/\/twitter\.com\/\w+\/status\/\d+$/);

    try {
      await expect(newPage.getByText("Post your reply")).toBeVisible();
      await newPage.close(); // 关闭页面
    } catch (error) {
      reportErrorMessage(testInfo.title);
      isTestFailed = true;
    }
  });

  test("bookmark some tweet in explore page", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/explore");

    const {
      actions: { bookmark, getHotTweet: getHotSelector },
    } = selector;

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`,
      {
        position: {
          x: 10,
          y: 10,
        },
      }
    );

    await newPage.waitForTimeout(3000);

    const element = await newPage.$(
      `${bookmark.firstArticle} ${bookmark.bookmarkButton}`
    );

    if (element) {
      const attributeValue = await element.getAttribute("aria-label");
      if (attributeValue?.endsWith("Bookmarked")) {
        await newPage.click(
          `${bookmark.firstArticle} ${bookmark.bookmarkButton}`
        );
        await newPage.waitForTimeout(2000);

        const attributeValue = await element.getAttribute("aria-label");
        if (attributeValue?.endsWith("Bookmark")) {
          await newPage.close();
          test.skip();
        }
      } else {
        await newPage.click(
          `${bookmark.firstArticle} ${bookmark.bookmarkButton}`
        );
        await newPage.waitForTimeout(2000);
        const attributeValue = await element.getAttribute("aria-label");
        if (attributeValue?.endsWith("Bookmarked")) {
          await newPage.close();
          test.skip();
        } else {
          reportErrorMessage(testInfo.title);
          isTestFailed = true;
        }
      }
    }
    await newPage.close(); // 关闭页面
  });

  test("follow someone", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const {
      actions: { follow: followSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      'div[aria-label="Trending"] div[data-testid^="UserAvatar-Container"]'
    );

    await newPage.click(
      `${followSelector.profile} ${followSelector.followButton}`
    );

    await newPage.waitForSelector(
      'div[data-testid$="-unfollow"][aria-label^="Following"]'
    );

    await newPage.waitForTimeout(2000);

    try {
      expect(
        await newPage.textContent(
          `${followSelector.profile} ${followSelector.followButton}`
        )
      ).toContain("Following");
      await newPage.close(); // 关闭页面
    } catch (error) {
      reportErrorMessage(testInfo.title);
      isTestFailed = true;
    }
  });

  test("like some tweet in explore page", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const {
      actions: { like: likeSelector, getHotTweet: getHotSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`,
      {
        position: {
          x: 10,
          y: 10,
        },
      }
    );
    await newPage.waitForTimeout(3000);

    const element = await newPage.$(
      `${likeSelector.firstArticle} ${likeSelector.likeButton}`
    );

    if (element) {
      const attributeValue = await element.getAttribute("aria-label");
      if (attributeValue?.endsWith("Liked")) {
        await newPage.click(
          `${likeSelector.firstArticle} ${likeSelector.likeButton}`
        );
        await newPage.waitForTimeout(2000);

        const attributeValue = await element.getAttribute("aria-label");
        if (attributeValue?.endsWith("Like")) {
          await newPage.close();
          test.skip();
        }
      } else {
        await newPage.click(
          `${likeSelector.firstArticle} ${likeSelector.likeButton}`
        );
        await newPage.waitForTimeout(2000);
        const attributeValue = await element.getAttribute("aria-label");
        if (attributeValue?.endsWith("Liked")) {
          await newPage.close();
          test.skip();
        } else {
          reportErrorMessage(testInfo.title);
          isTestFailed = true;
        }
      }
    }
    await newPage.close(); // 关闭页面
  });

  test("reply some tweet in explore page", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const {
      actions: { reply: replySelector, getHotTweet: getHotSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`,
      {
        position: {
          x: 10,
          y: 10,
        },
      }
    );

    await newPage.click(replySelector.editable);

    let inputContent = generateGreeting();

    for (const char of inputContent) {
      await newPage.waitForTimeout(200);
      await newPage.keyboard.press(char);
    }

    await newPage.click(replySelector.tweetButtonInline);

    await newPage.waitForTimeout(3000);

    try {
      const cellContent = (
        (await newPage.textContent('div[aria-label="Home timeline"]')) ?? ""
      ).replace(/[\s\uFEFF\xA0]+/g, "");
      if (cellContent.includes(inputContent.replace(/[\s\uFEFF\xA0]+/g, ""))) {
        await newPage.close(); // 关闭页面
      } else {
        const content = await newPage.textContent('div[aria-live="assertive"]');
        if (content?.includes("You already said that")) {
          test.skip();
        } else {
          reportErrorMessage(testInfo.title);
          isTestFailed = true;
        }
      }
    } catch (error) {
      reportErrorMessage(testInfo.title);
      isTestFailed = true;
    }
  });

  test("retweet some tweet in explore page", async ({}, testInfo) => {
    isTestFailed && test.skip();
    const {
      actions: { retweet: retweetSelector, getHotTweet: getHotSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`,
      {
        position: {
          x: 10,
          y: 10,
        },
      }
    );

    await newPage.click(
      `${retweetSelector.firstArticle} ${retweetSelector.retweetMenuButton}`
    );

    await newPage.click(retweetSelector.retweetConfirmButton);

    await newPage.waitForTimeout(4000);

    try {
      expect(
        await newPage.getAttribute(
          `${retweetSelector.firstArticle} ${retweetSelector.retweetMenuButton}`,
          "data-testid"
        )
      ).toEqual("unretweet");
      await newPage.close(); // 关闭页面
    } catch (error) {
      reportErrorMessage(testInfo.title);
      isTestFailed = true;
    }
  });
});

function generateGreeting(): string {
  const currentHour: number = new Date().getHours();

  let greeting: string;
  if (currentHour < 12) {
    greeting = "Good morning!";
  } else if (currentHour < 18) {
    greeting = "Good afternoon!";
  } else {
    greeting = "Good evening!";
  }

  return greeting;
}

async function reportErrorMessage(text: string) {
  return fetch(`${process.env.Reporter_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msg_type: "text",
      content: {
        text,
      },
    }),
  });
}
