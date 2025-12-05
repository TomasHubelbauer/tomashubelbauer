export type Repo = { name: string; full_name?: string; html_url?: string };

export type Event<TPayload> = {
  repo: Repo;
  payload: TPayload;
  type: string;
  actor: { login: string };
  created_at: string;
};

export type Issue = { number: number; title: string; html_url: string };

export type PullRequest = { number: number; title: string; html_url: string };

export type RepoPayload = {
  action: "starred" | "forked";
  old: number;
  new: number;
};

export type FollowerPayload =
  | { action: "followed"; newFollower: string }
  | { action: "unfollowed"; unfollower: string; duration?: number };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#createevent
export type CreatePayload = { ref: string; ref_type?: string };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pushevent
export type PushPayload = { head: string };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#watchevent
export type WatchPayload = { action?: "started" };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pullrequestevent
export type PullRequestPayload = {
  action: string;
  pull_request: PullRequest;
};

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#releaseevent
export type ReleasePayload = { release: { name: string; html_url: string } };

// https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestreviewevent
export type PullRequestReviewPayload = { pull_request: PullRequest };

// https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestreviewcommentevent
export type PullRequestReviewCommentPayload = {
  action: string;
  pull_request: PullRequest;
};

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#publicevent
export type PublicPayload = {};

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#memberevent
export type MemberPayload = { action: string };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#issuesevent
export type IssuePayload = { action: string; issue: Issue };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#issuecommentevent
export type IssueCommentPayload = { action: string; issue: Issue };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#gollumevent
export type GollumPayload = {};

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#forkevent
export type ForkPayload = { forkee: { full_name: string } };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#commitcommentevent
export type CommitCommentPayload = { action?: string };

// https://docs.github.com/en/developers/webhooks-and-events/github-event-types#deleteevent
export type DeletePayload = { ref: string; ref_type: "tag" | "branch" };
