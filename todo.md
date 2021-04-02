# To-Do

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

## Use the GraphQL v4 API to fetch watchers of all repositories in a single call

```graphql
query MyQuery {
  repositoryOwner(login: "TomasHubelbauer") {
    login repositories(first: 50, affiliations: OWNER) {
      edges {
        node {
          name watchers {
            totalCount
          }
        }
      }
    }
  }
} 
```

The GQL API requires authorization. Perhaps the GitHub Actions token will
suffice? If not I'd rather drop this feature than implement authorization for
accessing only public data; that's stupid.

## Save the changed date of each repo and fetch readmes on each change for todos

The get-repos API response should contain a repo-last-changed date. Save it and
if it changed between runs, download and cache the repos readme and pull todos
from it using my `todo` tool. Or maybe pull and cache todos from all of the repo
by fetching the whole repo if it has changed. Display the total number of all
todos across all repos in the readme and have another log file with all of the
todos in one place like is already done in `issues-and-prs.md`.
