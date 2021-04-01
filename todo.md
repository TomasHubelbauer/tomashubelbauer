# To-Do

## Display latest starer and watcher using Github API

When a repository receives new stars, we can talk to the Github API and fetch
the first page of star and watch entries. These responses should be sorted in
reverse chronological order so the top N items should be the new entries.

## Consider including stuff such as has pages/wiki etc. in the repo statistics

Could be cool to have events such as "enabled/disabled GitHub Pages on ${repo}".

## Consider changing the followers cache file format to be more compact

I've already compacted the repositories cache file structure significantly and I
think the same could be done for followers: make the top level item an object
and the follower logins keys to the object with an object for the follow and
unfollow date fields as their values.

## Detect deleted repos and skip their respective activity entries

We render the activity entries in reverse chronological order, which means that
if for each repo, we test it for existence on the first item related to it, and
it comes back negative, we can ignore that entry and any other entry touching
that repo. We'll probably use it just to prevent links to deleted repos from
rendering as links, but instead show as normal text. `repositories.json` should
be useful to detect deleted (missing) repositories.

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
