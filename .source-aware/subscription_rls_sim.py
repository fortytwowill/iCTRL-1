from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class Profile:
    user_id: str
    organization_id: str
    role: str


@dataclass
class Subscription:
    organization_id: str
    plan: str
    status: str
    trial_ends_at: datetime | None = None


def sub_admin_all_update_allowed(profile: Profile, row: Subscription, new_org_id: str) -> bool:
    using = (
        row.organization_id == profile.organization_id
        and profile.role in {"admin", "master_admin"}
    )
    with_check = new_org_id == profile.organization_id
    return using and with_check


def effective_plan(subscription: Subscription, now: datetime) -> str:
    if subscription.status in {"active", "past_due"}:
        return subscription.plan
    if subscription.status == "trialing" and subscription.trial_ends_at and subscription.trial_ends_at > now:
        return "trial"
    return "expired"


def can_write(profile: Profile, subscription: Subscription, now: datetime) -> bool:
    if profile.role in {None, "read_only"}:
        return False
    return effective_plan(subscription, now) not in {"expired", "pending"}


now = datetime.now(timezone.utc)
profile = Profile("ordinary-admin", "org-a", "admin")
subscription = Subscription("org-a", "starter", "active")
assert sub_admin_all_update_allowed(profile, subscription, "org-a")
subscription.plan = "enterprise"
assert effective_plan(subscription, now) == "enterprise"
assert can_write(profile, subscription, now)

subscription.status = "trialing"
subscription.trial_ends_at = now + timedelta(days=14)
assert effective_plan(subscription, now) == "trial"

print("ordinary admin UPDATE allowed:", True)
print("effective plan after plan=enterprise,status=active:", "enterprise")
print("can_write after tampering:", True)
print("effective plan after status=trialing,future trial_ends_at:", "trial")