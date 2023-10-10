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

let sharedContext: BrowserContext;

test.beforeAll(async ({ browser }) => {
  sharedContext = await browser.newContext();
});

test.afterAll(async () => {
  await sharedContext.close();
});

test.describe("Twitter test", () => {
  //login getAccountStatistic sendTweet getHotTweet bookmark follow like reply retweet

  test("should allow me to login and get my nickname@handle", async ({}) => {
    // Fill in the login form
    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/i/flow/login");

    await newPage.fill(
      'input[autocomplete="username"]',
      process.env.TWITTER_TEST_ACCOUNT ?? ""
    );

    await newPage.keyboard.press("Tab");
    await newPage.keyboard.press("Enter");

    // Fill in the login form
    await newPage.fill(
      'input[autocomplete="current-password"]',
      process.env.TWITTER_TEST_PASSWORD ?? ""
    );
    await newPage.keyboard.press("Tab");
    await newPage.keyboard.press("Tab");
    await newPage.keyboard.press("Tab");
    await newPage.keyboard.press("Enter");

    await newPage.waitForTimeout(1000); // 等待1秒钟

    // Assert that the login was successful
    const loggedInUserName = await newPage.textContent(
      'div[data-testid="SideNav_AccountSwitcher_Button"]'
    );
    expect(loggedInUserName).toContain("ZowieTao");

    await newPage.close(); // 关闭页面
  });

  test("show router to profile and get user info", async ({}) => {
    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/home");

    newPage.click('a[data-testid="AppTabBar_Profile_Link"]');

    const loggedInUserInfo = await newPage.textContent(
      'div[data-testid="UserName"]'
    );
    expect(loggedInUserInfo).toContain("ZowieTao");

    await newPage.close(); // 关闭页面
  });

  test("send a tweet for test", async ({}) => {
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

    await newPage.click('a[data-testid="AppTabBar_Profile_Link"]');

    const latestTweet = await newPage.textContent("article");

    expect((latestTweet ?? "").replace(/[\s\uFEFF\xA0]+/g, "")).toContain(
      inputContent.replace(/[\s\uFEFF\xA0]+/g, "")
    );

    await newPage.close(); // 关闭页面
  });

  test("get some hot twitter info", async ({}) => {
    const newPage = await sharedContext.newPage();
    const {
      actions: { getHotTweet: getHotSelector },
    } = selector;

    await newPage.goto("https://twitter.com/home");

    await newPage.click(getHotSelector.exploreButton);

    await newPage.click(getHotSelector.searchInput);

    await newPage.fill(getHotSelector.searchInput, "AI");

    await newPage.keyboard.press("Enter");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`
    );

    await newPage.waitForURL(/^https:\/\/twitter\.com\/\w+\/status\/\d+$/);

    await expect(newPage.getByText("Post your reply")).toBeVisible();

    await newPage.close(); // 关闭页面
  });

  test("bookmark some tweet in explore page", async ({}) => {
    const newPage = await sharedContext.newPage();
    await newPage.goto("https://twitter.com/explore");

    const {
      actions: { bookmark, getHotTweet: getHotSelector },
    } = selector;

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`
    );

    const currentMarkCount = await newPage.textContent(
      `${bookmark.firstArticle} ${bookmark.bookmarkButton}`
    );

    await newPage.click(`${bookmark.firstArticle} ${bookmark.bookmarkButton}`);

    await newPage.waitForTimeout(1000);

    const afterMarkCount = await newPage.textContent(
      `${bookmark.firstArticle} ${bookmark.bookmarkButton}`
    );

    expect(Number(currentMarkCount) + 1).toEqual(Number(afterMarkCount));

    await newPage.close(); // 关闭页面
  });

  test("follow someone", async () => {
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

    expect(
      await newPage.textContent(
        `${followSelector.profile} ${followSelector.followButton}`
      )
    ).toContain("Following");

    await newPage.close(); // 关闭页面
  });

  test("like some tweet in explore page", async () => {
    const {
      actions: { like: likeSelector, getHotTweet: getHotSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`
    );

    const currentMarkCount = await newPage.textContent(
      `${likeSelector.firstArticle} ${likeSelector.likeButton}`
    );
    await newPage.click(
      `${likeSelector.firstArticle} ${likeSelector.likeButton}`
    );
    await newPage.waitForTimeout(1000);

    const afterMarkCount = await newPage.textContent(
      `${likeSelector.firstArticle} ${likeSelector.likeButton}`
    );

    expect(Number(currentMarkCount) + 1).toEqual(Number(afterMarkCount));

    await newPage.close();
  });

  test("reply some tweet in explore page", async () => {
    const {
      actions: { reply: replySelector, getHotTweet: getHotSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`
    );

    await newPage.click(replySelector.editable);

    let inputContent = generateGreeting();

    for (const char of inputContent) {
      await newPage.waitForTimeout(200);
      await newPage.keyboard.press(char);
    }

    await newPage.click(replySelector.tweetButtonInline);

    await newPage.waitForTimeout(2000);

    expect(newPage.getByText(inputContent)).toBeVisible();

    await newPage.close(); // 关闭页面
  });

  test("retweet some tweet in explore page", async () => {
    const {
      actions: { retweet: retweetSelector, getHotTweet: getHotSelector },
    } = selector;
    const newPage = await sharedContext.newPage();

    await newPage.goto("https://twitter.com/explore");

    await newPage.click(
      `${getHotSelector.cellInnerDiv} ${getHotSelector.tweetArticle} div[data-testid="tweetText"]`
    );

    await newPage.click(
      `${retweetSelector.firstArticle} ${retweetSelector.retweetMenuButton}`
    );

    await newPage.click(retweetSelector.retweetConfirmButton);

    await newPage.waitForTimeout(2000);

    expect(
      await newPage.getAttribute(
        `${retweetSelector.firstArticle} ${retweetSelector.retweetMenuButton}`,
        "data-testid"
      )
    ).toEqual("unretweet");
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
