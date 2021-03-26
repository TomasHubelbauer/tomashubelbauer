# To-Do

## For forks of the same name, do not print even the name without account name

For a fork like `account/repo` into `tomashubelbauer/repo` we already print just
*Forked account/repo into repo* thanks to the `repo` function. But for forks it
makes sense to probably go as far as to print just *Forked account/repo*.

Maybe a downside here is the loss of the link that takes you to the fork if we
use the above wording. But we could turn the *Forked* word into the forked-repo
link?

This requires additional thought.

## Display new followers and unfollowers as their own entries

We'd need to fetch the activity pages like we already do and then also the
followers and compare that array to a capture array of known followers, find new
followers and unfollowers, insert virtual entries into the activities array and
store the newly fetched followers, updating the stored followers so that the
diff works out next time.

This should be fairly easy, we just need to remember to sort the new followers
and unfollowers into the activities array chronologically.

## Display new stars and forks on my repositories

This might be too much for the GitHub API, we'll see if the quota can handle it
(and we can potentially weight the repos by their current number of stars or
their recency or a mix of both and not check all of them for each run), but it
could be nice to also show entries for when one of my repos receives a star or
a fork.

## Add emojis representing the even type to aid visual navigation of the list

The most commonly represented types of events can drown out interesting but less
frequent event types. Adding an emoji per each time at the start of the line
will help with visual navigation and will make each entry stand out more.

## Detect deleted repos and skip their respective activity entries

We render the activity entries in reverse chronological order, which means that
if for each repo, we test it for existence on the first item related to it, and
it comes back negative, we can ignore that entry and any other entry touching
that repo. We'll probably use it just to prevent links to deleted repos from
rendering as links, but instead show as normal text.

## Make pull request activity entries proper links to the PR showing the PR #

Right now the PR experience is pretty poor, let's fix that.
