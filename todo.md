# To-Do

## Collect and generate view for repository tags shared across multiple repos

There is a big number of unique tags across all repositories.
It would be impractical to generate a file for each of these with the list of
repositories that sport this tag.

But for tags which are shared across multiple repos (2 or maybe an ever higher
threshold), it might be okay.

## Add a new item in the line with links and status for repos with broken rules

Missing description, missing tags, broken pages, broken workflows etc.

## Escape HTML in the commit message title line

I just commited with a message that named the HTML `<details>` element and it
did not go well.

## Add a `<details>` section at the end of the list item of multi-line commits

I aim to add description to all my commits now and it would be nice to see that
visually in the list for commit items.

## Use the GitHub API to replace the files' contents, not the Git client

I am not sure if one can force push a new history using the API, but it does not
work anyway at the moment, so I could live without the history filtering. The
main benefit here would be to stop attributing the automated commits to my user
account and stop inflating my user profile contribution chart.

https://github.com/TomasHubelbauer/github-actions-push-api#modification

## Consider including stuff such as has pages/wiki etc. in the repo statistics

Could be cool to have events such as "enabled/disabled GitHub Pages on ${repo}".

## Consider changing the followers cache file format to be more compact

I've already compacted the repositories cache file structure significantly and I
think the same could be done for followers: make the top level item an object
and the follower logins keys to the object with an object for the follow and
unfollow date fields as their values.

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

## Detect and warn on unindexed repositories

I want all my repositories to be "indexed" as in being referenced by any other
of my repositories. This is primarily to make sure I interlink repositories that
are related, but forcing this rule on all repositories will have a nice side
effect of forcing me to create an "index" repository of some sort, which will
link to and categorize all my repositories. (It being the exception from index.)

Do this by when fetching readmes, checking the content for links to other repos
and building a network of relations. Repositories not included in it should
cause the GitHub Actions workflow to fail.

## Collect information about repos with GitHub Pages and Pages links in them

Related to the repository indexing task above, while reading repository readmes,
also look for GitHub Pages link and report any repos whose GitHub Pages are
active, but the link is not in the readme, or vice versa. Then build `pages.log`
or similar where all the Pages sites are listed so that I can at glance see if
anything needs removing.

## Detect and report repository deletions and skip other events for those repos

Right now, the code can detect a deleted repository, but it can't remove it,
because on the next run, it would not be found as deleted anymore.

Instead, we need to mark the repository as deleted until the cutoff date is met
and only then remove it from the cache file for good, so that the repository-
deleted event is generated for as long as needed.

- [ ] Mark repository as deleted either in `repositories.json` or elsewhere
- [ ] Create virtual events for deleted repositories until cutoff date is met

## Address `TODO` comments in the source code

## Generate the first commit event in case of branch creation

It looks like branch creation encapsulates the first token too. But it might be
possible to create a branch without creating an initial token? Not sure. In any
case, I should generate an event for the first commit of a branch for each
branch creation event.

## Consider integrating reporting events for new releases of my watched repos

https://github.com/tomashubelbauer/github-releases

## Derive fork stamp from its creation date not discovery date

This will make the stamp more precise.

## Detect new PRs and add a received pull request event

## Recognize a situation where a repo is first seen already with stars

If a repo is both created and starred in a window before it is seen by this
script for the first time, the star increase is not shown.

## Add support for link titles and use them for multi-line commit messages

I am trying to get into a habit of adding descriptions for all commits I author
these days and to distinguish the ones which have it and those that do not, I
think the title attribute displaying the description as well as an ellipsis
following the link text would be a good way to surface this information in the
readme.

## Report on changes to my profile data

Bio, orgs, etc.
