// using node-fetch instead of octokit.
const fs = require("fs");
const simpleApiReq = (r, method, data, headers) => {
  return fetch("https://api.github.com/" + r, {
    method: method || "GET",
    headers: {
      ...(headers ?? {}),
      Accept: "application/vnd.github+json",
      Authorization: process.env.GITHUB_TOKEN,
    },
    body: data ? JSON.stringify(data) : undefined,
  }).then((r) => r.json());
};
const owner = process.env.OWNER_NAME || "hackclub";
const repo = process.env.REPO_NAME || "riceathon";
const pull_number = process.env.PR_NUMBER;
(async () => {
  const prData = await simpleApiReq(
    `repos/${owner}/${repo}/pulls/${pull_number}`,
    undefined,
    undefined,
    {
      Accept: "application/vnd.github.text+json",
    },
  );
  if (prData.body_text && prData.body_text.includes("automation:labels:rice")) {
    simpleApiReq(`repos/${owner}/${repo}/issues/${pr_number}/labels`, "POST", {
      labels: ["rice-setup"],
    });
  }
  const commentError = (message) =>
    simpleApiReq(
      `repos/${owner}/${repo}/pulls/${pull_number}/comments`,
      "POST",
      {
        event: "REQUEST_CHANGES",
        body: message,
      },
    );
  // validate members.json file
  // schema
  // name -> GH username here (ex: John Does dotfiles or what ever you name ur dotfiles)string (req)
  // dotfiles git link (optional) string
  // dotfiles os (nixos,arch,etc) string (req)
  // TODO: any other props?
  function validate(obj) {
    if (!obj.name) throw "No Name";
    if (!obj.os) throw "No OS provided";
    if (obj.git && typeof obj.git !== "string") throw "git is not a string";
    if (typeof obj.name !== "string") throw "Name is not a string";
    if (typeof obj.os !== "string") throw "OS is not a string";
    if (
      obj.git &&
      typeof obj.git === "string" &&
      !obj.git.startsWith("https://")
    )
      throw "git is not a url";
    return true;
  }
  const members = fs.readFileSync(process.cwd() + "/members.json");
  let already_thrown = false;
  try {
    let parsed = JSON.parse(members);
    if (Array.isArray(parsed)) {
      parsed.forEach((e) => {
        if (already_thrown) return;
        try {
          validate(e);
        } catch (e) {
          already_thrown = true;
          commentError(e.message);
        }
      });
    } else {
      commentError(`Its not an array `);
    }
  } catch (e) {
    commentError("Broken JSON:\n```" + e.message + "```");
  }
})();
