# To-Do

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
