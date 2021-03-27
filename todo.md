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

## Wait for GitHub to fix the MarkDown rendering in GitHub Pages

https://support.github.com/ticket/personal/0/1082581

The readme of this repository renders perfectly well on GitHub, but is broken on
the associated GitHub Pages site. I've alerted GitHub to this.

## Drop the history of `followers.json` and `repositories.json` without deleting

These files are required by the script to function properly and we want to track
their content, but we do not need their history. We can't completely dump them
like we do with `readme.md` thought because then the script wouldn't see them
and would be unable to use them for change detection.

Either we find a way to drop their history using `filter-branch` without erasing
the latest version or we copy them over to some temporary directory and then
back before the script is run. We can't copy them to backup names within the
directory, because `filter-branch` will not run if the repository has untracked
changes.
