function query(selector, attr) {
  const el = document.querySelector(selector);
  return el !== null ? el.getAttribute(attr).replace("\u200E", "") : null;
}

function queryAndThen(selector, callback) {
  const el = document.querySelector(selector);
  return el !== null ? callback(el) : null;
}

function metaP(property) {
  return query(`meta[property="${property}"]`, "content");
}

function metaN(name) {
  return query(`meta[name="${name}"]`, "content");
}

function presence(value) {
  if (value !== null && value !== undefined) {
    console.log(value);
    value = value.trim();
    if (value !== "") {
      return value;
    }
  }

  return null;
}

function queryExtra(extra, key, selector, callback) {
  const el = document.querySelector(selector);
  if (el !== null) {
    extra.push({ key: key, value: callback(el) });
  }
}

function queryAppleStoreMetadata(metadata) {
  const tags = metadata.tags.concat(["app", "from/app-store"]);

  const keywords = metaN("keywords") || "";
  if (keywords.indexOf("ios apps") >= 0) {
    tags.push("ios");
  }
  if (keywords.indexOf("mac apps") >= 0) {
    tags.push("macos");
  }
  if (keywords.indexOf("ipad") >= 0) {
    tags.push("ipad");
  }
  if (keywords.indexOf("iphone") >= 0) {
    tags.push("iphone");
  }
  metadata.tags = tags;

  const extra = metadata.extra;
  queryExtra(extra, "Author", ".app-header__identity a", (el) => el.innerText);
  queryExtra(extra, "Cateogry", 'a[href*="/genre"]', (el) => el.innerText);
  queryExtra(
    extra,
    "Price",
    ".app-header__list__item--price",
    (el) => el.innerText
  );
  queryExtra(
    extra,
    "Rating",
    ".star-rating__count",
    (el) => el.innerText.split(" ")[0]
  );
}

function queryAmazonUSMetadata(metadata) {
  metadata.image = query("#ebooksImgBlkFront", "src") || metadata.image;
  metadata.title =
    queryAndThen("#productTitle", (el) => el.innerText) || metadata.title;
  const iframe = document.getElementById("bookDesc_iframe");
  if (iframe !== null && iframe !== undefined) {
    const iframeContent =
      iframe.contentWindow.document.querySelector("#iframeContent");
    if (iframeContent !== null && iframeContent !== undefined) {
      metadata.description = iframeContent.innerText;
    }
  }
  metadata.tags.push("from/amazon-com");

  const authors = Array.from(document.querySelectorAll(".contributorNameID"))
    .map((e) => `[[${e.innerText}]]`)
    .join(" ");

  const extra = metadata.extra;
  extra.push({ key: "Author", value: authors });
  queryExtra(
    extra,
    "Rating",
    ".a-icon-star .a-icon-alt",
    (el) => el.innerText.split(" ")[0]
  );
}

function queryOreillyLearningMetadata(metadata) {
  metadata.tags.push("from/oreilly");

  const ogType = metaP("og:type");
  if (ogType !== null) {
    metadata.tags.push(ogType);
  }

  const extra = metadata.extra;
  const authors = Array.from(
    document.querySelectorAll('meta[property="og:book:author"]')
  )
    .map((el) => `[[${el.content}]]`)
    .join(" ");
  extra.push({ key: "Author", value: authors });
  queryExtra(
    extra,
    "ISBN",
    'meta[property="og:book:isbn"]',
    (el) => el.content
  );
  queryExtra(
    extra,
    "Publisher",
    'meta[name="publisher"]',
    (el) => `[[${el.content}]]`
  );
}

function queryGitHubMetadata(metadata) {
  // check if repo homepage
  if (metadata.href.split("/").length == 5) {
    const parts = metadata.title.split(": ", 2);
    metadata.title = parts[0];
    metadata.description = parts[1];
  }
  const topics = Array.from(document.querySelectorAll(".topic-tag")).map((el) =>
    el.text.trim()
  );

  metadata.tags = metadata.tags.concat(topics);
}

function queryMetadata() {
  const metadata = {};

  metadata.title = presence(metaP("og:title") || document.title);
  metadata.description = presence(
    metaP("og:description") || metaN("description")
  );
  metadata.image = presence(metaP("og:image"));
  metadata.tags = [];
  metadata.href = query('link[rel="canonical"]', "href") || location.href;
  metadata.host = metadata.href.split("://", 2)[1].split("/", 1)[0];
  metadata.extra = [];

  if (metadata.host === "apps.apple.com") {
    queryAppleStoreMetadata(metadata);
  } else if (metadata.host.indexOf("amazon.com") >= 0) {
    queryAmazonUSMetadata(metadata);
  } else if (metadata.host === "learning.oreilly.com") {
    queryOreillyLearningMetadata(metadata);
  } else if (metadata.host === "github.com") {
    queryGitHubMetadata(metadata);
  }

  return metadata;
}

var content = (function () {
  const metadata = queryMetadata();

  const mdTitle = metadata.title.replace(/[\[\]]/g, "\\$&");

  const lines = [`# ${mdTitle}`];
  if (metadata.image !== null) {
    lines.push(`![artwork](${metadata.image})`);
  }
  lines.push(`
## Metadata
`);

  if (metadata.image !== null) {
    lines.push(`**Artwork**:: ${metadata.image}`);
  }
  lines.push("**Zettel**:: #zettel/fleeting");
  lines.push("**Source**:: #from/browser");
  lines.push(`**URL**:: [${metadata.host}](${metadata.href})`);
  lines.push(`**Website**:: [[${metadata.host}]]`);
  if (metadata.tags.length > 0) {
    lines.push(`**Document Tags**:: #${metadata.tags.join(" #")}`);
  }
  lines.push(`**Created**: [[${new Date().toISOString().split("T")[0]}]]`);

  if (metadata.extra.length > 0) {
    metadata.extra.forEach((entry) => {
      lines.push(`**${entry.key}**:: ${entry.value}`);
    });
  }

  if (metadata.description !== null) {
    lines.push(`
## Description

${metadata.description}`);
  }

  return lines.join("\n");
})();

content;
