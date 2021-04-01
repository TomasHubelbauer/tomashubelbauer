# To-Do

## Display latest starer, forker and issuer based on the Github API repo data

When a repository receives new stars, we can talk to the Github API and fetch
the first page of star, fork and issue entries. These responses should be sorted
in chronological order so the top N items should be the new starrers, forkers or
issuers. I have a draft of this for starrers:

```diff
diff --git a/index.js b/index.js
index 3083bb6..f9248c8 100644
--- a/index.js
+++ b/index.js
@@ -160,6 +160,7 @@ void async function () {
 
   // Compare changes between repository attributes and generate events for them
   // Note that repo creations and deletions are handled by GitHub Activity API
+  const starrers = {};
   for (const repository in _repositories) {
     let _stat;
     const stats = _repositories[repository];
@@ -172,7 +173,14 @@ void async function () {
       }
 
       if (stat.stars !== _stat.stars) {
-        events.push({ actor: { login: 'TomasHubelbauer' }, created_at: stamp, type: 'RepositoryEvent', payload: { action: 'starred', old: _stat.stars, new: stat.stars, repo: repository } });
+        if (!starrers[repository]) {
+          starrers[repository] = await download('https://api.github.com/repos/tomasHubelbauer/' + repository + '/stargazers');
+          console.log('Fetched', repository, 'starrers');
+        }
+
+        // Get the latest starrer (this array is in a chronological order)
+        const starrer = starrers[repository].pop().login;
+        events.push({ actor: { login: 'TomasHubelbauer' }, created_at: stamp, type: 'RepositoryEvent', payload: { action: 'starred', old: _stat.stars, new: stat.stars, starrer, repo: repository } });
       }
 
       if (stat.forks !== _stat.forks) {
@@ -383,7 +391,7 @@ void async function () {
             const delta = event.payload.new - event.payload.old;
             const change = delta < 0 ? '📉 lost' : '📈 received';
             const word = delta !== 1 && delta !== -1 ? delta + ' stars' : 'a star';
-            markdown += `⭐️${change} ${word} on [${event.payload.repo}](https://github.com/tomashubelbauer/${event.payload.repo}) (now ${event.payload.new})`;
+            markdown += `⭐️${change} ${word} from ${event.payload.starrer} on [${event.payload.repo}](https://github.com/tomashubelbauer/${event.payload.repo}) (now ${event.payload.new})`;
             break;
           }
           case 'watched': {
```

However, this doesn't work well. The part where we fetch the repo data is likely
not a good spot to do it, because there we don't know if the change is a gain or
a loss, we'd have to compare the numbers. And in case there are gains and losses
mixed, we might need to do extra logic to account for the losses, it that is
even possible to do cleanly. We might reserve this feature for repositories that
only have gains in the inspected period or scrap it altogether.

## Consider including stuff such as has pages/wiki etc. in the repo statistics

Could be cool to have events such as "enabled/disabled GitHub Pages on ${repo}".

## Consider changing the followers cache file format to be more compact

I've already compacted the repositories cache file structure significantly and I
think the same could be done for followers: make the top level item an object
and the follower logins keys to the object with an object for the follow and
unfollow date fields as their values.

## Detect deleted repos and do not render their related items as broken links

We render the activity entries in a reverse chronological order and we also know
when repos have been deleted from the Activity API that gives us the `events`
array. This means for each repository-related event, we can determine if that
repository has been since deleted and if yes, render its names, commits and
other related items as mere text and not links to the respective items as those
links would be broken links.

## Throw if there exist any useless forks (no changes against upstream)

Search the repositories API response for forks and check each to see if it has
commits ahead of upstream and if not, throw to alert me to it so that I can
delete it.

## Switch on action payload field in member and PR events and use correct emoji

Right now the action is interpolated into the string so we don't know what
happened with the item. This means only a general emoji is shown, not a specific
emoji, like for example the bin one next to deletion/closure events.

## Display events for people I have followed and unfollowed

This will work similarly to how the people following me work, just sourcing the
event differently (hopefully the API has this info).

## Display events for my sponsors and people I have sponsored and unsponsored

This will work the same way as my followers and people I am following once the
latter is done.

## Remove dead / old accounts from `followers.json` to keep it uncluttered

People close accounts or get their accounts banned due to spam, no need to keep
those around. Only keep unfollowers but active accounts in the file so that it
can generate the followed/unfollowed events.

## Wait for GitHub support to clarify missing `subscribers_count` in repo model

The get-single-repo API endpoint returns `subscribers_count` which is the value
of repository watchers. The get-multiple-repos (that I'm using as I can't make
an API request for each of my hundreds of repositories) does not include this
field on the models of the individual repositories returned in the response
array. The docs suggest it should be there, hence my support request for
clarification:

https://support.github.com/ticket/personal/0/1089120
