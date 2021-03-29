# To-Do

## Preserve new stars, watches, forks and issues virtual events on my repos

I have implemented detection changes in the above attributes from one run to the
next, but since the `repositories.json` file gets updated with the new values on
each run, on the next run, this change is lost, so the virtual events only last
on hour until the next scheduled run.

To make them stick, the structure of `repositories.json` needs to be updated to
keep the numbers as of any given moment on a timeline going back to the oldest
date found in the GitHub Activity API entries. That way we can calculate events
between each snapshot and weave them into the event log at the correct places.
The same way follower change detection works. But since follower information is
only two-state and the repository attribute changes can be multiple, we need the
timeline data store and not just two flag fields with stamps for values.

We should clear entries older than the cutoff date from the Activity API to keep
the `repositories.json` file size somewhat constant and not ever-growing.

An alternative here would be to use the GitHub API to check detailed statistics
for each repository, but that would take too long and blow through the API rate
limit mercilessly. Such level of detail is not required.

## Detect deleted repos and skip their respective activity entries

We render the activity entries in reverse chronological order, which means that
if for each repo, we test it for existence on the first item related to it, and
it comes back negative, we can ignore that entry and any other entry touching
that repo. We'll probably use it just to prevent links to deleted repos from
rendering as links, but instead show as normal text. `repositories.json` should
be useful to detect deleted (missing) repositories.

## Throw if there exist any useless forks (no changes against upstream)

Search `repositories.json` for forks and check each to see if it has commits
ahead of upstream and if not, throw to alert me to it so that I can delete it.

## Switch on action payload field in member and PR events and use correct emoji

Right now the action is interpolated into the string so we don't know what
happened with the item. This means only a general emoji is shown, not a specific
emoji, like for example the bin one next to deletion/closure events.

## Display events for peoole I have followed and unfollowed

This will work similarly to how the people following me work, just sourcing the
event differently (hopefully the API has this info).

## Display events for my sponsors and people I have sponsored and unsponsored

This will work the same way as my followers and people I am following once the
latter is done.

## Remove dead / old accounts from `followers.json` to keep it uncluttered

People close accounts or get their accounts banned due to spam, no need to keep
those around. Only keep unfollowers but active accounts in the file so that it
can generate the followed/unfollowed events.
