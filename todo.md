# To-Do

## Display new stars, watches, forks and issues on my repositories

Use `repositories.json` to detect repos whose stars/watches/forks/issues have
changed since the last check, maybe fetch the repository for more details and
create a new virtual fake entry in the activity log for these events.

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

## Fix follower information getting lost

The algorithm for new follower and unfollower detection used now works, but it
isn't idempotent; the next time it runs, it will see the new follower in the
cached data and not treat it as a new follower anymore. I will probably need to
add the time stamp of when the follower was first spotted to the cached data and
work off that.
